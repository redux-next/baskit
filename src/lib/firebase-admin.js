
import "server-only";

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseCredentials() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  // Local development: service-account JSON file
  const serviceAccountPath = path.join(
    process.cwd(),
    ".secrets",
    "firebase-service-account.json"
  );

  if (existsSync(serviceAccountPath)) {
    return JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  }

  throw new Error(
    "Firebase Admin credentials are missing. Check FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID."
  );
}

const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(getFirebaseCredentials()),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;
