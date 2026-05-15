import admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Messaging } from 'firebase-admin/messaging';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env['FIREBASE_PROJECT_ID'],
      clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
      privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
    }),
  });
}

export const firebaseAdmin = admin;
export const firebaseAuth: Auth = admin.auth();
export const firebaseMessaging: Messaging = admin.messaging();
