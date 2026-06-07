import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidNoteDocument(data: any): boolean {
  if (!data) return false;
  return !data.temp && !!data.title && !!data.documentId;
}
