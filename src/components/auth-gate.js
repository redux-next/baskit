
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./auth-provider";
import StorefrontLoading from "./storefront-loading";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      setAllowed(false);

      if (loading) return;

      if (!user) {
        if (active) {
          setCheckingProfile(false);

          if (pathname === "/login") {
            setAllowed(true);
          } else {
            router.replace("/login");
          }
        }

        return;
      }

      try {
        setCheckingProfile(true);

        const profileRef = doc(db, "users", user.uid);
        const profileSnapshot = await getDoc(profileRef);

        const profile = profileSnapshot.exists()
          ? profileSnapshot.data()
          : null;

        const completed = profile?.profileCompleted === true;

        if (!active) return;

        if (!completed) {
          if (pathname === "/complete-profile") {
            setAllowed(true);
          } else {
            router.replace("/complete-profile");
          }

          return;
        }

        // Completed customers can still open the profile page
        // to edit their saved phone number and delivery address.
        if (pathname === "/complete-profile") {
          setAllowed(true);
          return;
        }

        if (pathname === "/login") {
          router.replace("/");
          return;
        }

        setAllowed(true);
      } catch (error) {
        console.error("Profile access check failed:", error);

        if (!active) return;

        if (pathname === "/complete-profile") {
          setAllowed(true);
        } else {
          router.replace("/complete-profile");
        }
      } finally {
        if (active) {
          setCheckingProfile(false);
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [user, loading, pathname, router]);

  if (loading || checkingProfile || !allowed) {
    if (pathname === "/") {
      return <StorefrontLoading />;
    }

    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <div className="text-center">
          <div className="h-9 w-9 mx-auto rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            Loading DailyCart...
          </p>
        </div>
      </main>
    );
  }

  return children;
}
