import { subjectCatalog } from '../../../data/subjectCatalog';

export interface SubjectResolutionResult {
  subjectId: string;
  displaySubject: string;
  subject: string;
  searchKey: string;
  matchedBy: 'exact_id' | 'name_match' | 'alias_match' | 'fallback';
}

export interface CatalogSubjectItem {
  id: string;
  name: string;
  shortName?: string;
  aliases?: string[];
}

export function resolveCollegeId(storedCollege?: string): string {
  if (!storedCollege) return 'kiit';
  const clean = storedCollege.trim().toLowerCase();
  if (clean === 'kiit' || clean.includes('kalinga')) return 'kiit';
  return clean;
}

export function resolveBranchId(storedBranch?: string): string {
  if (!storedBranch) return 'cse';
  const clean = storedBranch.trim().toLowerCase();
  if (clean.includes('computer science') || clean === 'cs' || clean === 'cse') return 'cse';
  if (clean.includes('information technology') || clean === 'it') return 'it';
  if (clean.includes('electronics') || clean === 'ece') return 'ece';
  if (clean.includes('electrical') || clean === 'eee') return 'eee';
  if (clean.includes('mechanical') || clean === 'mech') return 'mechanical';
  if (clean.includes('civil')) return 'civil';
  if (clean.includes('biotech')) return 'biotechnology';
  return clean;
}

export function getAllSubjectsFromCatalog(): CatalogSubjectItem[] {
  const map = new Map<string, CatalogSubjectItem>();

  function traverse(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.id && item.name) {
          const idLower = item.id.toLowerCase();
          if (!map.has(idLower)) {
            map.set(idLower, {
              id: idLower,
              name: item.name,
              shortName: item.shortName || item.name
            });
          }
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      traverse(obj[key]);
    }
  }

  traverse(subjectCatalog);

  // Common academic aliases for KIIT / B.Tech subjects
  const aliasesMap: Record<string, string[]> = {
    'dm': ['discrete mathematics', 'discrete maths', 'dm'],
    'dbms': ['database management system', 'database', 'dbms'],
    'coa': ['computer organization and architecture', 'computer organization', 'coa'],
    'oopj': ['object oriented programming java', 'java', 'oopj', 'oops'],
    'os': ['operating system', 'operating systems', 'os'],
    'daa': ['design and analysis of algorithms', 'algorithms', 'daa'],
    'ds': ['data structures', 'data structure', 'ds'],
    'afl': ['automata', 'formal languages', 'afl', 'toc'],
    'phy': ['physics', 'phy'],
    'chem': ['chemistry', 'chem'],
    'maths': ['mathematics', 'maths', 'de-la', 'de & la'],
    'ee': ['electrical engineering', 'basic electrical', 'bee', 'ee'],
    'betc': ['electronics', 'basic electronics', 'betc'],
    'se': ['software engineering', 'se'],
    'cn': ['computer networks', 'networking', 'cn']
  };

  const list = Array.from(map.values());
  return list.map(item => ({
    ...item,
    aliases: aliasesMap[item.id] || [item.id, item.name.toLowerCase()]
  }));
}

export function resolveSubject(
  textToScan: string,
  context?: { college?: string; branch?: string; semester?: string }
): SubjectResolutionResult | null {
  if (!textToScan || !textToScan.trim()) return null;

  const catalog = getAllSubjectsFromCatalog();
  const cleanInput = textToScan.trim().toLowerCase();
  const normalizedInput = cleanInput.replace(/[\._\-]/g, ' ');

  // 1. Direct ID Exact Match (Word boundary regex)
  for (const item of catalog) {
    const sId = item.id.toLowerCase();
    const idRegex = new RegExp(`\\b${sId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');

    if (idRegex.test(cleanInput) || idRegex.test(normalizedInput)) {
      const canonicalId = item.id.toLowerCase();
      return {
        subjectId: canonicalId,
        displaySubject: item.name,
        subject: canonicalId,
        searchKey: canonicalId,
        matchedBy: 'exact_id'
      };
    }
  }

  // 2. Name Match
  for (const item of catalog) {
    const sName = item.name.toLowerCase();
    const nameRegex = new RegExp(`\\b${sName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');

    if (nameRegex.test(cleanInput) || nameRegex.test(normalizedInput)) {
      const canonicalId = item.id.toLowerCase();
      return {
        subjectId: canonicalId,
        displaySubject: item.name,
        subject: canonicalId,
        searchKey: canonicalId,
        matchedBy: 'name_match'
      };
    }
  }

  // 3. Alias / Synonym Match
  for (const item of catalog) {
    if (item.aliases) {
      for (const alias of item.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(cleanInput) || aliasRegex.test(normalizedInput)) {
          const canonicalId = item.id.toLowerCase();
          return {
            subjectId: canonicalId,
            displaySubject: item.name,
            subject: canonicalId,
            searchKey: canonicalId,
            matchedBy: 'alias_match'
          };
        }
      }
    }
  }

  return null;
}
