import { SubjectOption } from '@/ai/prompts/metadataPrompt';
import { DomainMetadataDTO } from '@/ai/schemas/metadataSchema';
import { subjectCatalog } from '../../data/subjectCatalog';
import { DocumentTypes, DocumentType } from '@/constants/documentTypes';

export interface LocalParseResult {
  dto: DomainMetadataDTO;
  confidence: number;
  isCompleteMatch: boolean;
}

export function getAllSubjectsFromCatalog(customCatalog?: any): SubjectOption[] {
  const map = new Map<string, string>();
  const targetCatalog = customCatalog || subjectCatalog;

  function traverse(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.id && item.name) {
          map.set(item.id.toLowerCase(), item.name);
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      traverse(obj[key]);
    }
  }

  traverse(targetCatalog);
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}


export function parseFilenameMetadata(
  filename: string,
  subjectCatalogOptions: SubjectOption[],
  documentType: DocumentType = DocumentTypes.PYQ
): LocalParseResult | null {
  const cleanName = filename.replace(/\.[^/.]+$/, ""); // Strip file extension
  // Normalize delimiters (replace dots, underscores, hyphens with spaces for token searching)
  const normalizedText = cleanName.replace(/[\._\-]/g, ' ');

  const activeCatalog = subjectCatalogOptions.length > 0
    ? subjectCatalogOptions
    : getAllSubjectsFromCatalog();

  // 1. Year matching (e.g., 2022, 2023, 2024, 2025)
  const yearMatch = normalizedText.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // 2. Exam Type matching - Normalize to exact UI option strings ("Midsem", "Endsem", "Quiz")
  let examType: string | null = null;
  if (/\b(mid\s*sem(?:ester)?|mid-sem|midsem|internal\s*sem(?:ester)?|internal|mid-term|midterm)\b/i.test(normalizedText) || /\bmid\b/i.test(normalizedText)) {
    examType = 'Midsem';
  } else if (/\b(end\s*sem(?:ester)?|end-sem|endsem|final\s*sem(?:ester)?|final)\b/i.test(normalizedText) || /\bend\b/i.test(normalizedText)) {
    examType = 'Endsem';
  } else if (/\bquiz\b/i.test(normalizedText)) {
    examType = 'Quiz';
  }

  // 3. Semester matching (e.g., Sem 5, Semester 4)
  const semMatch = normalizedText.match(/\bsem(?:ester)?\s*([1-8])\b/i);
  const estimatedSemester = semMatch ? parseInt(semMatch[1], 10) : null;

  // 4. Subject matching against catalog
  let matchedSubjectId: string | null = null;
  for (const s of activeCatalog) {
    const sId = s.id.toLowerCase();
    const sName = s.name.toLowerCase();

    const idRegex = new RegExp(`\\b${sId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
    const nameRegex = new RegExp(`\\b${sName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');

    if (idRegex.test(normalizedText) || nameRegex.test(normalizedText) || idRegex.test(cleanName) || nameRegex.test(cleanName)) {
      matchedSubjectId = s.id;
      break;
    }
  }

  // Determine if complete match
  let isCompleteMatch = false;
  let confidence = 0;

  if (matchedSubjectId) confidence += 0.50;
  if (examType) confidence += 0.25;
  if (year) confidence += 0.20;

  if (documentType === DocumentTypes.PYQ) {
    if (matchedSubjectId && examType && year) {
      isCompleteMatch = true;
      confidence = 0.95;
    }
  } else if (documentType === DocumentTypes.NOTES) {
    if (matchedSubjectId) {
      isCompleteMatch = true;
      confidence = 0.90;
    }
  }

  if (confidence < 0.50 && !matchedSubjectId) {
    console.log(`[AI Debug] Filename Parser result for "${filename}": Null (No subject found)`);
    return null;
  }

  const result: LocalParseResult = {
    dto: {
      subjectId: matchedSubjectId || undefined,
      examType: examType || undefined,
      year: year || undefined,
      estimatedSemester,
      resourceType: examType ? 'Previous Year Paper' : 'Lecture Notes',
      topics: [cleanName],
      title: cleanName,
      description: `${cleanName} - extracted from filename`,
      confidence
    },
    confidence,
    isCompleteMatch
  };

  console.log(`[AI Debug] Filename Parser result for "${filename}":`, {
    matchedSubjectId,
    examType,
    year,
    confidence,
    isCompleteMatch
  });

  return result;
}
