import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subjectCatalog as fallbackCatalog } from '../../data/subjectCatalog';

export interface CollegeOption {
  id: string;
  name: string;
}

export interface BranchOption {
  id: string;
  name: string;
}

export interface SemesterOption {
  id: string;
  name: string;
}

export interface SubjectOption {
  id: string;
  name: string;
}

export interface NoteDocumentSummary {
  college?: string;
  branch?: string;
  semester?: string;
  subject?: string;
  displaySubject?: string;
}

export const formatBranchName = (rawBranch: string): string => {
  if (!rawBranch) return 'General';
  const clean = rawBranch.trim().toLowerCase();
  if (clean === 'cse' || clean.includes('computer science')) return 'CSE';
  if (clean === 'it' || clean.includes('information technology')) return 'IT';
  if (clean === 'ece' || clean.includes('electronics')) return 'ECE';
  if (clean === 'ee' || clean.includes('electrical')) return 'EE';
  if (clean === 'me' || clean === 'mech' || clean.includes('mechanical')) return 'ME';
  if (clean === 'ce' || clean.includes('civil')) return 'CE';
  if (clean === 'cs' || clean === 'computer science') return 'CS';
  return rawBranch.toUpperCase();
};

export const formatSemesterName = (rawSem: string): string => {
  if (!rawSem) return 'General';
  const match = rawSem.toString().match(/\d+/);
  if (match) return `Semester ${match[0]}`;
  return rawSem;
};

export const extractSemNumber = (rawSem: string): string => {
  if (!rawSem) return '';
  const match = rawSem.toString().match(/\d+/);
  return match ? match[0] : rawSem.trim();
};

export function useNotesCatalog(notes: NoteDocumentSummary[] = []) {
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [catalogData, setCatalogData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch colleges document from app_config/colleges
      let collegesList: CollegeOption[] = [];
      try {
        const collegesSnap = await getDoc(doc(db, 'app_config', 'colleges'));
        if (collegesSnap.exists()) {
          const data = collegesSnap.data();
          if (Array.isArray(data.colleges)) {
            collegesList = data.colleges.map((c: any) => ({
              id: (c.id || c.name || '').toString().toLowerCase().trim(),
              name: c.name || c.id || 'College'
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch app_config/colleges doc from Firestore, using derived/fallback:', err);
      }

      // 2. Fetch subject catalog document from app_config/subject_catalog
      let rawCatalog: any = null;
      try {
        const catalogSnap = await getDoc(doc(db, 'app_config', 'subject_catalog'));
        if (catalogSnap.exists()) {
          rawCatalog = catalogSnap.data();
        }
      } catch (err) {
        console.warn('Could not fetch app_config/subject_catalog doc from Firestore, using local fallback:', err);
      }

      if (!rawCatalog) {
        rawCatalog = fallbackCatalog;
      }

      setCatalogData(rawCatalog);

      // If colleges list not fetched from app_config/colleges, derive top-level keys from catalog object
      if (collegesList.length === 0 && rawCatalog) {
        const keys = Object.keys(rawCatalog).filter(k => typeof rawCatalog[k] === 'object');
        collegesList = keys.map(k => ({
          id: k.toLowerCase(),
          name: k.toUpperCase()
        }));
      }

      setColleges(collegesList);
    } catch (err: any) {
      console.error('Error fetching Firestore catalog:', err);
      setError('Failed to load App Catalog from Firestore.');
      // Graceful fallback to static catalog data
      setCatalogData(fallbackCatalog);
      setColleges([{ id: 'kiit', name: 'KIIT' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Reconcile colleges with actual uploaded Notes
  const reconciledColleges = useMemo<CollegeOption[]>(() => {
    const map = new Map<string, string>();
    colleges.forEach(c => map.set(c.id.toLowerCase(), c.name));

    // Incorporate notes colleges
    notes.forEach(note => {
      if (note.college) {
        const id = note.college.trim().toLowerCase();
        if (id && !map.has(id)) {
          map.set(id, note.college.toUpperCase());
        }
      }
    });

    if (map.size === 0) {
      map.set('kiit', 'KIIT');
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [colleges, notes]);

  // Derive branches for a given college (or all colleges)
  const getBranches = useMemo(() => {
    return (collegeId: string | 'all' | null): BranchOption[] => {
      const branchMap = new Map<string, string>();

      const activeCatalog = catalogData || fallbackCatalog;

      const extractBranchesFromCollegeObj = (colObj: any) => {
        if (!colObj || typeof colObj !== 'object') return;
        Object.keys(colObj).forEach(key => {
          const lowerKey = key.toLowerCase();
          // Skip general group keys like GROUP_A, GROUP_B
          if (lowerKey !== 'group_a' && lowerKey !== 'group_b' && typeof colObj[key] === 'object') {
            const formatted = formatBranchName(key);
            branchMap.set(lowerKey, formatted);
          }
        });
      };

      if (collegeId === 'all' || !collegeId) {
        if (activeCatalog) {
          Object.keys(activeCatalog).forEach(colKey => {
            extractBranchesFromCollegeObj(activeCatalog[colKey]);
          });
        }
      } else {
        const colKey = Object.keys(activeCatalog || {}).find(
          k => k.toLowerCase() === collegeId.toLowerCase()
        );
        if (colKey) {
          extractBranchesFromCollegeObj(activeCatalog[colKey]);
        }
      }

      // Reconcile with actual notes branches
      notes.forEach(n => {
        if (n.branch) {
          const noteCol = (n.college || '').toLowerCase();
          if (collegeId === 'all' || !collegeId || !noteCol || noteCol === collegeId.toLowerCase()) {
            const formatted = formatBranchName(n.branch);
            const id = formatted.toLowerCase();
            if (!branchMap.has(id)) {
              branchMap.set(id, formatted);
            }
          }
        }
      });

      return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }));
    };
  }, [catalogData, notes]);

  // Derive semesters for a college and branch
  const getSemesters = useMemo(() => {
    return (collegeId: string | 'all' | null, branchId: string | 'all' | null): SemesterOption[] => {
      const semSet = new Set<string>();

      const activeCatalog = catalogData || fallbackCatalog;

      const extractSemsFromBranchObj = (branchObj: any) => {
        if (!branchObj || typeof branchObj !== 'object') return;
        Object.keys(branchObj).forEach(semKey => {
          const num = extractSemNumber(semKey);
          if (num) {
            semSet.add(num);
          }
        });
      };

      const processCollegeObj = (colObj: any) => {
        if (!colObj || typeof colObj !== 'object') return;
        if (branchId === 'all' || !branchId) {
          Object.keys(colObj).forEach(bKey => {
            if (bKey.toLowerCase() !== 'group_a' && bKey.toLowerCase() !== 'group_b') {
              extractSemsFromBranchObj(colObj[bKey]);
            }
          });
          // Semesters 1 & 2 are also standard
          if (colObj.GROUP_A || colObj.group_a) {
            semSet.add('1');
            semSet.add('2');
          }
        } else {
          const bKey = Object.keys(colObj).find(
            k => k.toLowerCase() === branchId.toLowerCase() || formatBranchName(k).toLowerCase() === branchId.toLowerCase()
          );
          if (bKey) {
            extractSemsFromBranchObj(colObj[bKey]);
          }
          if (colObj.GROUP_A || colObj.group_a) {
            semSet.add('1');
            semSet.add('2');
          }
        }
      };

      if (collegeId === 'all' || !collegeId) {
        if (activeCatalog) {
          Object.keys(activeCatalog).forEach(colKey => {
            processCollegeObj(activeCatalog[colKey]);
          });
        }
      } else {
        const colKey = Object.keys(activeCatalog || {}).find(
          k => k.toLowerCase() === collegeId.toLowerCase()
        );
        if (colKey) {
          processCollegeObj(activeCatalog[colKey]);
        }
      }

      // Reconcile with actual notes semesters
      notes.forEach(n => {
        if (n.semester) {
          const noteCol = (n.college || '').toLowerCase();
          const noteBranch = formatBranchName(n.branch || '').toLowerCase();

          const matchesCollege = collegeId === 'all' || !collegeId || !noteCol || noteCol === collegeId.toLowerCase();
          const matchesBranch = branchId === 'all' || !branchId || !noteBranch || noteBranch === branchId.toLowerCase();

          if (matchesCollege && matchesBranch) {
            const num = extractSemNumber(n.semester);
            if (num) {
              semSet.add(num);
            }
          }
        }
      });

      // Sort semesters numerically (e.g. 1, 2, 3, 4, 5, 6, 7, 8)
      const sortedNums = Array.from(semSet).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });

      return sortedNums.map(num => ({
        id: num,
        name: formatSemesterName(num)
      }));
    };
  }, [catalogData, notes]);

  // Derive subjects for a specific semester
  const getSubjects = useMemo(() => {
    return (
      collegeId: string | 'all' | null,
      branchId: string | 'all' | null,
      semesterId: string | 'all' | null
    ): SubjectOption[] => {
      const subjectMap = new Map<string, string>(); // key: id, val: display name
      const activeCatalog = catalogData || fallbackCatalog;

      const addSubjectList = (list: any[]) => {
        if (!Array.isArray(list)) return;
        list.forEach(s => {
          if (s && s.id && s.name) {
            subjectMap.set(s.id.toLowerCase(), s.name);
          }
        });
      };

      const processCollegeSubjects = (colObj: any) => {
        if (!colObj || typeof colObj !== 'object') return;

        // Group A / B handling for semester 1 and 2
        if (semesterId === '1') {
          addSubjectList(colObj.GROUP_A || colObj.group_a);
        } else if (semesterId === '2') {
          addSubjectList(colObj.GROUP_B || colObj.group_b);
        }

        Object.keys(colObj).forEach(bKey => {
          if (bKey.toLowerCase() === 'group_a' || bKey.toLowerCase() === 'group_b') return;

          const matchesBranch =
            branchId === 'all' ||
            !branchId ||
            bKey.toLowerCase() === branchId.toLowerCase() ||
            formatBranchName(bKey).toLowerCase() === branchId.toLowerCase();

          if (matchesBranch) {
            const branchObj = colObj[bKey];
            if (branchObj && typeof branchObj === 'object') {
              Object.keys(branchObj).forEach(semKey => {
                const semNum = extractSemNumber(semKey);
                const matchesSem =
                  semesterId === 'all' ||
                  !semesterId ||
                  semNum === semesterId;

                if (matchesSem) {
                  addSubjectList(branchObj[semKey]);
                }
              });
            }
          }
        });
      };

      if (collegeId === 'all' || !collegeId) {
        if (activeCatalog) {
          Object.keys(activeCatalog).forEach(cKey => {
            processCollegeSubjects(activeCatalog[cKey]);
          });
        }
      } else {
        const cKey = Object.keys(activeCatalog || {}).find(
          k => k.toLowerCase() === collegeId.toLowerCase()
        );
        if (cKey) {
          processCollegeSubjects(activeCatalog[cKey]);
        }
      }

      // Reconcile with actual notes subjects
      notes.forEach(n => {
        const noteCol = (n.college || '').toLowerCase();
        const noteBranch = formatBranchName(n.branch || '').toLowerCase();
        const noteSem = extractSemNumber(n.semester || '');

        const matchesCol = collegeId === 'all' || !collegeId || !noteCol || noteCol === collegeId.toLowerCase();
        const matchesBr = branchId === 'all' || !branchId || !noteBranch || noteBranch === branchId.toLowerCase();
        const matchesSm = semesterId === 'all' || !semesterId || !noteSem || noteSem === semesterId;

        if (matchesCol && matchesBr && matchesSm) {
          const subName = n.displaySubject || n.subject;
          if (subName) {
            const id = subName.toLowerCase().trim();
            if (!subjectMap.has(id)) {
              subjectMap.set(id, subName);
            }
          }
        }
      });

      return Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
    };
  }, [catalogData, notes]);

  return {
    colleges: reconciledColleges,
    getBranches,
    getSemesters,
    getSubjects,
    isLoading,
    error,
    reloadCatalog: loadCatalog
  };
}

export const useAppCatalog = useNotesCatalog;

