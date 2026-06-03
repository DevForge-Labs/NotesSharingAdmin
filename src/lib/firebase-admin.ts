import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ID = 'notessharingapp-dfee3';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serviceAccountPath = join(__dirname, '../../secrets/serviceAccount.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: PROJECT_ID,
      });

export const db = getFirestore(app);
