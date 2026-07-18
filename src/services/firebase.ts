import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
// Support both JSON file (for AI Studio) and Environment Variables (for Render/GitHub)
let aiStudioConfig: any = {};
try {
  // @ts-ignore
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  aiStudioConfig = configs['../../firebase-applet-config.json']?.default || {};
} catch (e) {
  // Ignore missing file
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || aiStudioConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || aiStudioConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || aiStudioConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || aiStudioConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || aiStudioConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || aiStudioConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || aiStudioConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || aiStudioConfig.firestoreDatabaseId || '(default)'
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export { db, analytics };
