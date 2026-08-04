import { DocumentType, DocumentTypes } from '@/constants/documentTypes';

export function resolveResourceType(
  filename: string,
  pdfText: string,
  documentType?: DocumentType
): string {
  const combinedText = `${filename} ${pdfText}`.toLowerCase();

  if (documentType === DocumentTypes.PYQ || /\b(pyq|endsem|midsem|quiz|question\s*paper|previous\s*year|exam\s*paper)\b/i.test(combinedText)) {
    return 'Previous Year Paper';
  }

  if (documentType === DocumentTypes.ASSIGNMENT || /\b(assignment|assign|hw|home\s*work|problem\s*set)\b/i.test(combinedText)) {
    return 'Assignment';
  }

  if (documentType === DocumentTypes.CHEATSHEET || /\b(cheat\s*sheet|cheatsheet|formula\s*sheet|quick\s*reference|summary\s*sheet)\b/i.test(combinedText)) {
    return 'Cheat Sheet';
  }

  if (/\b(lab|lab\s*manual|practical|experiment|viva)\b/i.test(combinedText)) {
    return 'Lab Manual';
  }

  if (/\b(book|textbook|author|edition|volume)\b/i.test(combinedText)) {
    return 'Textbook';
  }

  if (/\b(model\s*paper|sample\s*paper|mock\s*test)\b/i.test(combinedText)) {
    return 'Model Paper';
  }

  return 'Lecture Notes';
}
