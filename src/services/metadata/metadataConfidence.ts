import { DocumentType, DocumentTypes } from '@/constants/documentTypes';

export interface ConfidenceCalculationParams {
  hasSubject: boolean;
  hasExamType: boolean;
  hasYear: boolean;
  hasUnitOrAssignment: boolean;
  documentType?: DocumentType;
}

export function computeMetadataConfidence(params: ConfidenceCalculationParams): number {
  const { hasSubject, hasExamType, hasYear, hasUnitOrAssignment, documentType } = params;

  if (documentType === DocumentTypes.PYQ) {
    if (hasSubject && hasExamType && hasYear) return 0.95;
    if (hasSubject && (hasExamType || hasYear)) return 0.85;
    if (hasSubject) return 0.75;
    if (hasExamType && hasYear) return 0.60;
    return 0.30;
  }

  // Notes / Assignments / Cheatsheets
  if (hasSubject && hasUnitOrAssignment) return 0.95;
  if (hasSubject) return 0.90;
  if (hasYear) return 0.50;

  return 0.30;
}
