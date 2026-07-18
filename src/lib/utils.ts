import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidNoteDocument(data: any): boolean {
  if (!data) return false;
  return !data.temp && !!data.title && !!data.documentId;
}

export function removeFileExtension(title?: string): string {
  if (!title) return "";
  const extensions = [".pdf", ".docx", ".pptx", ".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const lowerTitle = title.toLowerCase();
  for (const ext of extensions) {
    if (lowerTitle.endsWith(ext)) {
      return title.substring(0, title.length - ext.length);
    }
  }
  return title;
}

export function sanitizeFileName(name: string): string {
  const lastDotIndex = name.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
  const ext = lastDotIndex !== -1 ? name.substring(lastDotIndex + 1) : "";
  const sanitizedBase = baseName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ext ? `${sanitizedBase}.${ext.toLowerCase()}` : sanitizedBase;
}
