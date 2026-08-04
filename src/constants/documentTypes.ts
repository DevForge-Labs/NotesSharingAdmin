export const DocumentTypes = {
  NOTES: 'Notes',
  PYQ: 'PYQ',
  ASSIGNMENT: 'Assignment',
  CHEATSHEET: 'CheatSheet',
  VIDEO: 'Video',
  PLAYLIST: 'Playlist',
} as const;

export type DocumentType = typeof DocumentTypes[keyof typeof DocumentTypes];
