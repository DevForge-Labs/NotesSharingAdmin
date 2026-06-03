import { subjectCatalog } from '../data/subjectCatalog.ts';
import { db } from '../src/lib/firebase-admin.ts';

export async function seedSubjects(): Promise<void> {
  console.log('Starting subject catalog seeding...');

  await db
    .collection('app_config')
    .doc('subject_catalog')
    .set(subjectCatalog, { merge: false });

  console.log('Subject catalog seeded successfully.');
}

seedSubjects()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
