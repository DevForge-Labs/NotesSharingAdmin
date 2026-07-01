import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  FirestoreError,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report } from '@/types/report';

// In-memory cache for original resource metadata keyed by "resourceType_resourceId"
const metadataCache: Record<string, any> = {};

export const reportService = {
  subscribeToPendingReports: (
    onNext: (reports: Report[]) => void,
    onError: (error: FirestoreError) => void
  ) => {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reports: Report[] = [];
        snapshot.forEach((doc) => {
          reports.push({
            id: doc.id,
            ...doc.data(),
          } as Report);
        });
        onNext(reports);
      },
      onError
    );
  },

  fetchResourceMetadata: async (
    resourceType: string,
    resourceId: string
  ): Promise<any> => {
    const cacheKey = `${resourceType}_${resourceId}`;
    
    // Check in-memory cache first
    if (metadataCache[cacheKey] !== undefined) {
      return metadataCache[cacheKey];
    }

    try {
      const docRef = doc(db, resourceType, resourceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const metadata = {
          ...data,
          id: docSnap.id,
          branch: data.branch || '',
          semester: data.semester || '',
          subject: data.displaySubject || data.subject || '',
          title: data.title || '',
          thumbnailUrl: data.thumbnailUrl || data.youtubeThumbnailUrl || ''
        };
        metadataCache[cacheKey] = metadata;
        return metadata;
      }
      
      metadataCache[cacheKey] = null;
      return null;
    } catch (error) {
      console.error("Failed to fetch original resource metadata:", error);
      return null;
    }
  },

  dismissReport: async (reportId: string, resolvedByUid: string): Promise<void> => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: 'resolved',
      actionTaken: 'dismissed',
      resolvedAt: serverTimestamp(),
      resolvedByUid: resolvedByUid
    });
  },

  resolveReportDeleted: async (reportId: string, resolvedByUid: string): Promise<void> => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: 'resolved',
      actionTaken: 'deleted',
      resolvedAt: serverTimestamp(),
      resolvedByUid: resolvedByUid
    });
  }
};
export default reportService;
