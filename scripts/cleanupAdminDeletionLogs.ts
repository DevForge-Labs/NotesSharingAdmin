import { db } from '../src/lib/firebase-admin.ts';

async function cleanupAdminDeletionLogs(): Promise<void> {
  console.log("Starting admin_deletion_logs cleanup...");

  const startOfTodayDate = new Date();
  startOfTodayDate.setHours(0, 0, 0, 0);
  const startOfToday = startOfTodayDate.getTime();

  console.log(`Local timezone start of today: ${startOfTodayDate.toString()} (${startOfToday} ms)`);

  let scannedCount = 0;
  let deletedCount = 0;
  let retainedCount = 0;

  const docsToDelete: FirebaseFirestore.DocumentReference[] = [];

  // Read all documents from admin_deletion_logs
  const snapshot = await db.collection('admin_deletion_logs').get();

  snapshot.forEach(doc => {
    scannedCount++;
    const data = doc.data();
    const deletedAt = data?.deletedAt;

    if (deletedAt === undefined || deletedAt === null) {
      retainedCount++;
      return;
    }

    const deletedAtNum = Number(deletedAt);
    if (isNaN(deletedAtNum)) {
      retainedCount++;
      return;
    }

    if (deletedAtNum < startOfToday) {
      docsToDelete.push(doc.ref);
    } else {
      retainedCount++;
    }
  });

  console.log(`Scanned ${scannedCount} documents. Found ${docsToDelete.length} to delete.`);

  // Firestore batches can handle up to 500 writes. We use batches of 400 for safety.
  const BATCH_SIZE = 400;
  for (let i = 0; i < docsToDelete.length; i += BATCH_SIZE) {
    const chunk = docsToDelete.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(docRef => {
      batch.delete(docRef);
    });

    await batch.commit();
    deletedCount += chunk.length;
    console.log(`Deleted batch of ${chunk.length} documents... (${deletedCount}/${docsToDelete.length})`);
  }

  console.log("\nCleanup Summary:");
  console.log(`- Number of documents scanned: ${scannedCount}`);
  console.log(`- Number of documents deleted: ${deletedCount}`);
  console.log(`- Number of documents retained: ${retainedCount}`);
}

cleanupAdminDeletionLogs()
  .then(() => {
    console.log("Cleanup completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Cleanup failed with error:", error);
    process.exit(1);
  });
