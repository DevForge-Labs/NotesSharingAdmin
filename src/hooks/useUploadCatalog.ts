import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subjectCatalog as fallbackCatalog } from '../../data/subjectCatalog';
import { formatBranchName } from './useNotesCatalog';

export interface CatalogCollege {
  id: string;
  name: string;
}

export interface CatalogBranch {
  id: string;
  name: string;
}

export interface CatalogSemester {
  id: string;
  name: string;
}

export interface CatalogSubject {
  id: string;
  name: string;
  shortName: string;
  active?: boolean;
}

export function useUploadCatalog() {
  const [colleges, setColleges] = useState<CatalogCollege[]>([]);
  const [rawCatalog, setRawCatalog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch colleges list from Firestore app_config/colleges
      let collegeList: CatalogCollege[] = [];
      try {
        const colSnap = await getDoc(doc(db, 'app_config', 'colleges'));
        if (colSnap.exists()) {
          const data = colSnap.data();
          if (Array.isArray(data.colleges)) {
            collegeList = data.colleges.map((c: any) => ({
              id: (c.id || c.name || '').toString().toLowerCase().trim(),
              name: c.name || c.id || 'College'
            }));
          }
        }
      } catch (e) {
        console.warn('Could not fetch app_config/colleges doc from Firestore:', e);
      }

      // 2. Fetch subject catalog tree from Firestore app_config/subject_catalog
      let subjectCat: any = null;
      try {
        const catSnap = await getDoc(doc(db, 'app_config', 'subject_catalog'));
        if (catSnap.exists()) {
          subjectCat = catSnap.data();
        }
      } catch (e) {
        console.warn('Could not fetch app_config/subject_catalog doc from Firestore:', e);
      }

      if (!subjectCat) {
        subjectCat = fallbackCatalog;
      }

      setRawCatalog(subjectCat);

      // If collegeList is empty, derive top-level keys from subject_catalog
      if (collegeList.length === 0 && subjectCat) {
        const keys = Object.keys(subjectCat).filter(k => typeof subjectCat[k] === 'object');
        collegeList = keys.map(k => ({
          id: k.toLowerCase(),
          name: k.toUpperCase()
        }));
      }

      setColleges(collegeList);
    } catch (err: any) {
      console.error('Error loading upload catalog from Firestore:', err);
      setError('Failed to load dynamic catalog from Firestore.');
      setRawCatalog(fallbackCatalog);
      setColleges([{ id: 'kiit', name: 'KIIT' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const activeCatalog = rawCatalog || fallbackCatalog;

  // Derive branches dynamically for selected college
  const getBranches = useCallback((collegeId: string): CatalogBranch[] => {
    if (!collegeId) return [];
    const colKey = Object.keys(activeCatalog || {}).find(
      k => k.toLowerCase() === collegeId.toLowerCase().trim()
    );
    if (!colKey) return [];

    const collegeObj = activeCatalog[colKey];
    if (!collegeObj || typeof collegeObj !== 'object') return [];

    const branches: CatalogBranch[] = [];
    Object.keys(collegeObj).forEach(key => {
      const lower = key.toLowerCase();
      if (lower !== 'group_a' && lower !== 'group_b' && typeof collegeObj[key] === 'object' && !Array.isArray(collegeObj[key])) {
        branches.push({
          id: lower,
          name: formatBranchName(key)
        });
      }
    });

    return branches;
  }, [activeCatalog]);

  // Derive semesters dynamically for selected college and branch
  const getSemesters = useCallback((collegeId: string, branchId: string): CatalogSemester[] => {
    if (!collegeId) return [];
    const semSet = new Set<string>();

    const colKey = Object.keys(activeCatalog || {}).find(
      k => k.toLowerCase() === collegeId.toLowerCase().trim()
    );
    if (colKey) {
      const collegeObj = activeCatalog[colKey];
      if (collegeObj) {
        if (collegeObj.GROUP_A || collegeObj.group_a || collegeObj.GROUP_B || collegeObj.group_b) {
          semSet.add('1');
          semSet.add('2');
        }
        if (branchId) {
          const bKey = Object.keys(collegeObj).find(
            k => k.toLowerCase() === branchId.toLowerCase().trim() || formatBranchName(k).toLowerCase() === branchId.toLowerCase().trim()
          );
          if (bKey && collegeObj[bKey] && typeof collegeObj[bKey] === 'object') {
            Object.keys(collegeObj[bKey]).forEach(semKey => {
              const numMatch = semKey.match(/\d+/);
              if (numMatch) semSet.add(numMatch[0]);
            });
          }
        }
      }
    }

    if (semSet.size === 0) {
      for (let i = 1; i <= 8; i++) semSet.add(i.toString());
    }

    return Array.from(semSet)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map(num => ({
        id: `Semester ${num}`,
        name: `Semester ${num}`
      }));
  }, [activeCatalog]);

  // Derive subjects dynamically for selected college, branch, semester, and group
  const getSubjects = useCallback((
    collegeId: string,
    branchId: string,
    semesterStr: string,
    groupStr?: string
  ): CatalogSubject[] => {
    if (!collegeId) return [];

    const colKey = Object.keys(activeCatalog || {}).find(
      k => k.toLowerCase() === collegeId.toLowerCase().trim()
    );
    if (!colKey) return [];

    const collegeCatalog = activeCatalog[colKey];
    if (!collegeCatalog) return [];

    const match = (semesterStr || '').match(/\d+/);
    const semNum = match ? parseInt(match[0], 10) : 0;

    let rawSubjects: any[] = [];

    // Semester 1
    if (semNum === 1) {
      if (groupStr === 'Group A') rawSubjects = collegeCatalog.GROUP_A || collegeCatalog.group_a || [];
      else if (groupStr === 'Group B') rawSubjects = collegeCatalog.GROUP_B || collegeCatalog.group_b || [];
      else {
        const grpA = collegeCatalog.GROUP_A || collegeCatalog.group_a || [];
        const grpB = collegeCatalog.GROUP_B || collegeCatalog.group_b || [];
        rawSubjects = [...(Array.isArray(grpA) ? grpA : []), ...(Array.isArray(grpB) ? grpB : [])];
      }
    }
    // Semester 2
    else if (semNum === 2) {
      if (groupStr === 'Group A') rawSubjects = collegeCatalog.GROUP_B || collegeCatalog.group_b || [];
      else if (groupStr === 'Group B') rawSubjects = collegeCatalog.GROUP_A || collegeCatalog.group_a || [];
      else {
        const grpA = collegeCatalog.GROUP_A || collegeCatalog.group_a || [];
        const grpB = collegeCatalog.GROUP_B || collegeCatalog.group_b || [];
        rawSubjects = [...(Array.isArray(grpA) ? grpA : []), ...(Array.isArray(grpB) ? grpB : [])];
      }
    }
    // Semester 3+
    else if (branchId && semNum >= 3) {
      const bKey = Object.keys(collegeCatalog).find(
        k => k.toLowerCase() === branchId.toLowerCase().trim() || formatBranchName(k).toLowerCase() === branchId.toLowerCase().trim()
      );
      if (bKey && collegeCatalog[bKey]) {
        rawSubjects = collegeCatalog[bKey][semNum] || collegeCatalog[bKey][`sem_${semNum}`] || [];
      }
    }
    // Fallback if branch selected without semester or semester selected without branch
    else if (branchId) {
      const bKey = Object.keys(collegeCatalog).find(
        k => k.toLowerCase() === branchId.toLowerCase().trim() || formatBranchName(k).toLowerCase() === branchId.toLowerCase().trim()
      );
      if (bKey && collegeCatalog[bKey]) {
        Object.values(collegeCatalog[bKey]).forEach(semArr => {
          if (Array.isArray(semArr)) {
            rawSubjects.push(...semArr);
          }
        });
      }
    }

    if (!Array.isArray(rawSubjects)) return [];

    return rawSubjects.map((s: any) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName || s.name,
      active: s.active !== false
    }));
  }, [activeCatalog]);

  // Extract all subjects in active catalog flat array (for AI matching)
  const allSubjects = useMemo<CatalogSubject[]>(() => {
    const map = new Map<string, CatalogSubject>();
    function traverse(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && item.id && item.name) {
            const idLower = item.id.toLowerCase();
            if (!map.has(idLower)) {
              map.set(idLower, {
                id: item.id,
                name: item.name,
                shortName: item.shortName || item.name,
                active: item.active !== false
              });
            }
          }
        }
        return;
      }
      for (const k of Object.keys(obj)) {
        traverse(obj[k]);
      }
    }
    traverse(activeCatalog);
    return Array.from(map.values());
  }, [activeCatalog]);

  return {
    colleges,
    getBranches,
    getSemesters,
    getSubjects,
    allSubjects,
    isLoading,
    error,
    reloadCatalog: fetchCatalog,
    rawCatalog: activeCatalog
  };
}
