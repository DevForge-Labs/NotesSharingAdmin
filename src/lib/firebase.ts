import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4PovUAFgIV1mPt6R9YfU4hVwdrDzGsBM",
  authDomain: "notessharingapp-dfee3.firebaseapp.com",
  projectId: "notessharingapp-dfee3",
  storageBucket: "notessharingapp-dfee3.firebasestorage.app",
  messagingSenderId: "1093598842915",
  appId: "1:1093598842915:web:1c21cdf155695afca5e196",
  measurementId: "G-SZEFCBQP6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Apply custom parameters to Google provider if needed
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
