import { db } from './firebase';
import { doc, runTransaction } from 'firebase/firestore';

const THRESHOLDS = [0, 5, 15, 30, 50];

function calculateLevel(totalUploads: number): number {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalUploads >= THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

const typeFieldMap: Record<string, string> = {
  notes: 'notesUploads',
  assignments: 'assignmentUploads',
  cheatsheets: 'cheatSheetUploads',
  pyqs: 'pyqUploads',
  videos: 'youtubeResourceUploads'
};

export async function incrementUserUploads(
  uid: string,
  type: 'notes' | 'assignments' | 'pyqs' | 'cheatsheets' | 'videos',
  count: number = 1
): Promise<void> {
  if (!uid || uid === 'admin-uploader') return;
  const docRef = doc(db, 'users', uid);
  const typeField = typeFieldMap[type];
  if (!typeField) return;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists()) {
      const initData: any = {
        uid: uid,
        totalUploads: count,
        contributorLevel: calculateLevel(count),
        bookmarks: 0,
        upvotes: 0,
        branch: 'Computer Science',
        createdAt: Date.now()
      };
      
      const allTypeFields = ['pyqUploads', 'notesUploads', 'cheatSheetUploads', 'assignmentUploads', 'youtubeResourceUploads'];
      for (const field of allTypeFields) {
        initData[field] = field === typeField ? count : 0;
      }
      transaction.set(docRef, initData);
    } else {
      const data = snapshot.data();
      const currentUploads = (data?.totalUploads as number) || 0;
      const newUploads = currentUploads + count;
      const currentTypeUploads = (data?.[typeField] as number) || 0;

      const updates: any = {
        totalUploads: newUploads,
        contributorLevel: calculateLevel(newUploads),
        [typeField]: currentTypeUploads + count
      };

      const allTypeFields = ['pyqUploads', 'notesUploads', 'cheatSheetUploads', 'assignmentUploads', 'youtubeResourceUploads'];
      for (const field of allTypeFields) {
        if (field !== typeField && data?.[field] === undefined) {
          updates[field] = 0;
        }
      }
      transaction.update(docRef, updates);
    }
  });
}
