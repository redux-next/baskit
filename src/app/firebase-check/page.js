
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function FirebaseCheckPage() {
  const [status, setStatus] = useState("Checking Firebase connection...");

  useEffect(() => {
    async function checkConnection() {
      try {
        // The existing Firestore rules allow public reads
        // from the settings collection.
        await getDoc(doc(db, "settings", "connection-check"));

        setStatus("SUCCESS: Firebase Firestore is connected!");
      } catch (error) {
        console.error("Firebase connection error:", error);
        setStatus(`FAILED: ${error.code || error.message}`);
      }
    }

    checkConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          DailyCart Firebase Check
        </h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
