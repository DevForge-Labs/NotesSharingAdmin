export interface Report {
  id: string; // Firestore document ID
  resourceId: string;
  resourceType: 'notes' | 'assignments' | 'pyqs' | 'cheatsheets' | 'videos' | string;
  resourceTitle: string;
  resourceThumbnail?: string;

  uploaderUid: string;
  uploaderName: string;
  uploaderEmail: string | null;

  reporterUid: string;
  reporterName: string;
  reporterEmail: string | null;

  reason: string;
  customMessage?: string;

  status: 'pending' | 'resolved' | 'dismissed' | string;

  createdAt: any; // Firestore Timestamp, Date, string, or number

  resolvedAt?: any;
  resolvedByUid?: string;
  actionTaken?: string;
}
