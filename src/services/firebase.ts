import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use the specific firestoreDatabaseId if provided, otherwise default
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

export { db };
