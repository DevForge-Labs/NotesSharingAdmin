import { DocumentType } from '@/constants/documentTypes';
import { ResourceTypes } from '@/constants/resourceTypes';

export interface SubjectOption {
  id: string;
  name: string;
}

export interface PromptContext {
  filename: string;
  firstPageText: string;
  documentType: DocumentType;
  subjectCatalog: SubjectOption[];
}

export function buildMetadataPrompt(context: PromptContext): string {
  const { filename, firstPageText, documentType, subjectCatalog } = context;

  const allowedResources = ResourceTypes[documentType] || [];
  const catalogFormatted = subjectCatalog.length > 0 
    ? JSON.stringify(subjectCatalog, null, 2)
    : '[] (No catalog constraints provided)';

  return `You are an expert academic document analyzer for a university platform.

Extract metadata from the following academic document based on its filename and first-page text.

DOCUMENT METADATA context:
- Target Document Type: "${documentType}"
- Filename: "${filename}"
- Allowed Resource Types for this Document Type: ${JSON.stringify(allowedResources)}
- Allowed Subject Catalog:
${catalogFormatted}

INSTRUCTIONS:
1. SUBJECT MATCHING: If the document matches any subject in the Allowed Subject Catalog, select its exact "id". Do NOT invent new subject IDs. If no subject matches confidently, return null for subjectId.
2. RESOURCE TYPE: Select strictly one from the Allowed Resource Types list above.
3. EXAM TYPE (if PYQ): Must be "MidSem" or "EndSem" if inferable.
4. YEAR: Extract 4-digit exam/publication year (e.g. 2025).
5. SEMESTER: Extract numeric semester (1 to 8) if inferable.
6. TOPICS: Extract 3-6 key academic concepts/keywords covered in the text (e.g. ["Inheritance", "Polymorphism", "Collections"]).
7. TITLE: Provide a clean, accurate title.
8. DESCRIPTION: Provide a concise one-line summary.
9. CONFIDENCE: Provide a decimal confidence score between 0.00 and 1.00 based on how certainty of extraction.

FIRST PAGE TEXT:
---
${firstPageText ? firstPageText.substring(0, 3000) : '[No text extracted from Page 1]'}
---

Return structured JSON adhering strictly to the response schema.`;
}
