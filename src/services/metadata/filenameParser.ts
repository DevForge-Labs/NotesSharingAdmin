export interface ParsedFilenameResult {
  year?: number;
  examType?: 'Endsem' | 'Midsem' | 'Quiz';
  subjectToken?: string;
  unit?: string;
  assignmentNum?: number;
  section?: string;
  resourceType?: string;
  cleanTitle: string;
}

export function parseFilename(filename: string): ParsedFilenameResult {
  const cleanTitle = filename.replace(/\.[^/.]+$/, ""); // Strip file extension
  const normalizedText = cleanTitle.replace(/[\._\-]/g, ' ');

  // 1. Year Extraction (e.g. 2020 - 2029)
  const yearMatch = normalizedText.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  // 2. Exam Type Extraction (Endsem, Midsem, Quiz)
  let examType: 'Endsem' | 'Midsem' | 'Quiz' | undefined = undefined;
  if (/\b(end\s*sem(?:ester)?|end-sem|endsem|final\s*sem(?:ester)?|final)\b/i.test(normalizedText) || /\bend\b/i.test(normalizedText)) {
    examType = 'Endsem';
  } else if (/\b(mid\s*sem(?:ester)?|mid-sem|midsem|internal\s*sem(?:ester)?|internal|mid-term|midterm)\b/i.test(normalizedText) || /\bmid\b/i.test(normalizedText)) {
    examType = 'Midsem';
  } else if (/\bquiz\b/i.test(normalizedText)) {
    examType = 'Quiz';
  }

  // 3. Unit / Module Extraction (e.g. Unit 1, Unit-2, Module 3, Mod 4)
  let unit: string | undefined = undefined;
  const unitMatch = normalizedText.match(/\b(?:unit|module|mod)\s*([1-8])\b/i);
  if (unitMatch) {
    unit = `Unit ${unitMatch[1]}`;
  }

  // 4. Assignment Number Extraction (e.g. Assignment 1, Assign 2, HW 3, Assg 1)
  let assignmentNum: number | undefined = undefined;
  const assignMatch = normalizedText.match(/\b(?:assignment|assign|assg|hw)\s*([1-9])\b/i);
  if (assignMatch) {
    assignmentNum = parseInt(assignMatch[1], 10);
  }

  // 5. Section Extraction (e.g. Section A, Sec B, Group 1)
  let section: string | undefined = undefined;
  const secMatch = normalizedText.match(/\b(?:sec(?:tion)?|group|grp)\s*([a-z0-9]{1,4})\b/i);
  if (secMatch) {
    section = secMatch[1].toUpperCase();
  }

  // 6. Resource Type Extraction
  let resourceType: string | undefined = undefined;
  if (examType || /\b(pyq|previous\s*year|question\s*paper|paper)\b/i.test(normalizedText)) {
    resourceType = 'Previous Year Paper';
  } else if (assignmentNum || /\b(assignment|assign|assg|hw)\b/i.test(normalizedText)) {
    resourceType = 'Assignment';
  } else if (/\b(cheat\s*sheet|cheatsheet|formula\s*sheet)\b/i.test(normalizedText)) {
    resourceType = 'Cheat Sheet';
  } else if (/\b(lab|lab\s*manual|practical)\b/i.test(normalizedText)) {
    resourceType = 'Lab Manual';
  } else if (/\b(notes|lecture|handwritten)\b/i.test(normalizedText)) {
    resourceType = 'Lecture Notes';
  }

  // 7. Subject Token Extraction heuristic (Look for potential subject code tokens)
  const tokens = normalizedText.split(/\s+/);
  let subjectToken: string | undefined = undefined;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) continue;
    if (/^(end|mid|sem|semester|unit|module|notes|pyq|assignment|assign|assg|lab|sheet|year|paper|sec|section|group)$/i.test(token)) continue;

    if (/^[A-Za-z0-9&\-]{2,8}$/.test(token)) {
      subjectToken = token;
      break;
    }
  }

  return {
    year,
    examType,
    subjectToken,
    unit,
    assignmentNum,
    section,
    resourceType,
    cleanTitle
  };
}
