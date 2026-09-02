import { DocumentType, DocumentTypes } from '@/constants/documentTypes';
import { parseFilename } from './filenameParser';
import { extractFirstPagePdfText } from './pdfTextParser';
import { resolveSubject, resolveCollegeId, resolveBranchId } from './subjectResolver';
import { resolveResourceType } from './resourceTypeResolver';
import { computeMetadataConfidence } from './metadataConfidence';

export interface DeterministicMetadataOutput {
  title: string;
  description: string;
  subject: string;
  subjectId: string;
  displaySubject: string;
  searchKey: string;
  semester: string;
  branch: string;
  college: string;
  examType?: string;
  examYear?: string;
  section?: string;
  resourceType: string;
  topics: string[];
  confidence: number;
}

export interface ExtractMetadataOptions {
  file: File;
  documentType: DocumentType;
  context?: {
    college?: string;
    branch?: string;
    semester?: string;
  };
  subjectCatalogOptions?: { id: string; name: string }[];
  onProgressStep?: (stepName: string) => void;
  signal?: AbortSignal;
}

export async function extractMetadataDeterministically(
  options: ExtractMetadataOptions
): Promise<DeterministicMetadataOutput> {
  const { file, documentType, context, subjectCatalogOptions, onProgressStep, signal } = options;

  // 1. Reading filename...
  if (onProgressStep) onProgressStep('Reading filename...');
  const filenameResult = parseFilename(file.name);

  // 2. Resolving subject...
  if (onProgressStep) onProgressStep('Resolving subject...');
  let subjectRes = resolveSubject(filenameResult.cleanTitle, context, subjectCatalogOptions);
  if (!subjectRes && filenameResult.subjectToken) {
    subjectRes = resolveSubject(filenameResult.subjectToken, context, subjectCatalogOptions);
  }

  const collegeId = resolveCollegeId(context?.college);
  const branchId = resolveBranchId(context?.branch);
  const semesterVal = context?.semester || '';

  let examType = filenameResult.examType;
  let year = filenameResult.year;
  let unit = filenameResult.unit;
  let section = filenameResult.section;
  let pdfText = '';

  // Check if Filename alone has high confidence
  const initialConfidence = computeMetadataConfidence({
    hasSubject: !!subjectRes,
    hasExamType: !!examType,
    hasYear: !!year,
    hasUnitOrAssignment: !!unit || !!filenameResult.assignmentNum || !!section,
    documentType
  });

  // RULE: If filename already provides sufficient confidence (>= 0.85), SKIP PDF EXTRACTION completely!
  if (initialConfidence < 0.85) {
    // 3. Reading PDF...
    if (onProgressStep) onProgressStep('Reading PDF...');
    const pdfResult = await extractFirstPagePdfText(file, signal);
    pdfText = pdfResult.firstPageText;

    if (!subjectRes && pdfText) {
      subjectRes = resolveSubject(pdfText, context, subjectCatalogOptions);
    }
    if (!examType && pdfResult.extractedExamType) {
      examType = pdfResult.extractedExamType;
    }
    if (!year && pdfResult.extractedYear) {
      year = pdfResult.extractedYear;
    }
    if (!unit && pdfResult.extractedUnit) {
      unit = pdfResult.extractedUnit;
    }
  }

  // 4. Building metadata...
  if (onProgressStep) onProgressStep('Building metadata...');

  const finalSubjectId = subjectRes ? subjectRes.subjectId : '';
  const finalDisplaySubject = subjectRes ? subjectRes.displaySubject : '';

  const finalResourceType = resolveResourceType(file.name, pdfText, documentType);

  const finalConfidence = computeMetadataConfidence({
    hasSubject: !!subjectRes,
    hasExamType: !!examType,
    hasYear: !!year,
    hasUnitOrAssignment: !!unit || !!filenameResult.assignmentNum || !!section,
    documentType
  });

  const topics: string[] = [filenameResult.cleanTitle];
  if (finalDisplaySubject) topics.push(finalDisplaySubject);
  if (unit) topics.push(unit);
  if (section) topics.push(`Section ${section}`);

  const output: DeterministicMetadataOutput = {
    title: filenameResult.cleanTitle,
    description: `${filenameResult.cleanTitle} - auto generated`,
    subject: finalSubjectId,
    subjectId: finalSubjectId,
    displaySubject: finalDisplaySubject,
    searchKey: finalSubjectId,
    semester: semesterVal,
    branch: branchId,
    college: collegeId,
    examType: examType || undefined,
    examYear: year ? year.toString() : undefined,
    section: section || undefined,
    resourceType: finalResourceType,
    topics,
    confidence: finalConfidence
  };

  console.log(`[Deterministic Metadata Engine] Result for "${file.name}":`, output);
  return output;
}
