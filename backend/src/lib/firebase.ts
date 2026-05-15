import admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Messaging } from 'firebase-admin/messaging';

let _auth: Auth | null = null;
let _messaging: Messaging | null = null;

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Missing credentials — Firebase Auth + FCM disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

initFirebase();

export const firebaseAdmin = admin;

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    if (!admin.apps.length) throw new Error('Firebase not initialized — add Firebase credentials to .env');
    _auth = admin.auth();
  }
  return _auth;
}

export function getFirebaseMessaging(): Messaging {
  if (!_messaging) {
    if (!admin.apps.length) throw new Error('Firebase not initialized — add Firebase credentials to .env');
    _messaging = admin.messaging();
  }
  return _messaging;
}

// Convenience exports — will throw if Firebase not configured
export const firebaseAuth = { verifyIdToken: (token: string) => getFirebaseAuth().verifyIdToken(token) };
