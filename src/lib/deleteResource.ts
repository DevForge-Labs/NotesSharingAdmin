import { db, storage } from './firebase';
import { doc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export interface DeleteResourceParams {
  resourceId: string;
  resourceType: 'notes' | 'assignments' | 'pyqs' | 'cheatsheets' | 'videos';
  resourceTitle: string;
  uploaderUid: string;
  uploaderName: string;
  uploaderEmail: string | null;
  uploaderFcmToken: string | null;
  deletedByUid: string;
  deletedByName: string;
  deletionReason: string;
  customReason: string;
  storagePaths: string[];
  resourceSnapshot: {
    title: string;
    subject: string;
    branch: string;
    semester: string;
    uploaderName: string;
    uploaderUid: string;
    fileUrl?: string;
    storagePath?: string;
  };
}

export async function deleteResource(params: DeleteResourceParams): Promise<{ success: boolean; error?: any }> {
  try {
    // 1. Create deletion audit log in Firestore
    const auditLog = {
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      resourceTitle: params.resourceTitle,
      uploaderUid: params.uploaderUid || '',
      uploaderName: params.uploaderName || 'Anonymous',
      uploaderEmail: params.uploaderEmail || null,
      uploaderFcmToken: params.uploaderFcmToken || null,
      deletedByUid: params.deletedByUid,
      deletedByName: params.deletedByName || 'Admin',
      deletionReason: params.deletionReason,
      customReason: params.customReason,
      deletedAt: Date.now(),
      storagePaths: params.storagePaths,
      notificationSent: false,
      resourceSnapshot: params.resourceSnapshot,
    };

    // This will throw if the write fails, preventing deletion
    await addDoc(collection(db, 'admin_deletion_logs'), auditLog);

    // 2. Delete associated files from Storage
    for (const pathOrUrl of params.storagePaths) {
      if (!pathOrUrl) continue;

      try {
        let storageRef;
        if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
          if (pathOrUrl.includes('firebasestorage.googleapis.com')) {
            storageRef = ref(storage, pathOrUrl);
          } else {
            // Skip external links (e.g. YouTube URLs, external thumbnails)
            continue;
          }
        } else {
          // Relative path or gs:// URL
          storageRef = ref(storage, pathOrUrl);
        }

        if (storageRef) {
          await deleteObject(storageRef);
        }
      } catch (error) {
        console.warn('Storage file already missing or failed to delete:', pathOrUrl, error);
      }
    }

    // 3. Delete resource document from Firestore
    await deleteDoc(doc(db, params.resourceType, params.resourceId));

    return { success: true };
  } catch (error: any) {
    console.error('Failed to complete deleteResource workflow:', error);
    return { success: false, error };
  }
}
