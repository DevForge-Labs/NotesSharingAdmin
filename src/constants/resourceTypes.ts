import { DocumentTypes, DocumentType } from './documentTypes';

export const ResourceTypes: Record<DocumentType, readonly string[]> = {
  [DocumentTypes.NOTES]: [
    'Lecture Notes',
    'Handwritten Notes',
    'Slides',
    'Textbook',
    'Summary Notes'
  ],
  [DocumentTypes.PYQ]: [
    'Previous Year Paper',
    'Sample Paper',
    'Model Paper'
  ],
  [DocumentTypes.ASSIGNMENT]: [
    'Assignment'
  ],
  [DocumentTypes.CHEATSHEET]: [
    'Cheat Sheet'
  ],
  [DocumentTypes.VIDEO]: [
    'Video'
  ],
  [DocumentTypes.PLAYLIST]: [
    'Playlist'
  ]
};

export const ExamTypes = ['MidSem', 'EndSem'] as const;
export type ExamType = typeof ExamTypes[number];
