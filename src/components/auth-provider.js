
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

// Detect the existing Android app WebView, not ordinary mobile Chrome.
function isDailyCartAndroidApp() {
  if (typeof navigator === "undefined") return false;

  return navigator.userAgent.includes("QuickBiteAndroidApp");
}

// Request a Google ID token from the native Android application.
function requestNativeGoogleToken() {
  return new Promise((resolve, reject) => {
    if (!isDailyCartAndroidApp()) {
      reject(new Error("DailyCart Android app was not detected."));
      return;
    }

    let completed = false;

    const cleanup = () => {
      window.onNativeGoogleSignInResult = null;
      clearTimeout(timeout);
    };

    const finish = (callback, value) => {
      if (completed) return;

      completed = true;
      cleanup();
      callback(value);
    };

    const timeout = setTimeout(() => {
      finish(
        reject,
        new Error("Google sign-in timed out. Please try again.")
      );
    }, 120000);

    window.onNativeGoogleSignInResult = (idToken, error) => {
      if (error) {
        finish(reject, new Error(error));
        return;
      }

      if (!idToken || typeof idToken !== "string") {
        finish(
          reject,
          new Error("Google did not return a valid ID token.")
        );
        return;
      }

      finish(resolve, idToken);
    };

    try {
      // Android intercepts this URL and opens Credential Manager.
      window.location.href = "QuickBite://google-sign-in";
    } catch (error) {
      finish(reject, error);
    }
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authRequest = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        const requestId = ++authRequest;

        setLoading(true);
        setUser(currentUser);
        setClaims({});

        if (!currentUser) {
          if (active && requestId === authRequest) {
            setLoading(false);
          }
          return;
        }

        try {
          const tokenResult =
            await currentUser.getIdTokenResult(true);

          if (!active || requestId !== authRequest) return;

          setClaims(tokenResult.claims || {});
        } catch (error) {
          console.error(
            "Unable to load Firebase custom claims:",
            error
          );

          if (!active || requestId !== authRequest) return;

          setClaims({});
        } finally {
          if (active && requestId === authRequest) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      authRequest++;
      unsubscribe();
    };
  }, []);

  // Google Sign-In:
  // Native Credential Manager in the Android app.
  // Firebase popup in normal browsers.
  const loginWithGoogle = useCallback(async () => {
    let result;

    if (isDailyCartAndroidApp()) {
      const idToken = await requestNativeGoogleToken();

      const credential =
        GoogleAuthProvider.credential(idToken);

      result = await signInWithCredential(auth, credential);
    } else {
      result = await signInWithPopup(auth, googleProvider);
    }

    const tokenResult =
      await result.user.getIdTokenResult(true);

    setUser(result.user);
    setClaims(tokenResult.claims || {});

    return result.user;
  }, []);

  // Email/password login remains unchanged.
  const loginWithEmail = useCallback(
    async (email, password) => {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const tokenResult =
        await result.user.getIdTokenResult(true);

      setUser(result.user);
      setClaims(tokenResult.claims || {});

      return result.user;
    },
    []
  );

  // Email/password registration remains unchanged.
  const registerWithEmail = useCallback(
    async (name, email, password) => {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      const tokenResult =
        await result.user.getIdTokenResult(true);

      setUser(result.user);
      setClaims(tokenResult.claims || {});

      return result.user;
    },
    []
  );

  const refreshClaims = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setClaims({});
      return {};
    }

    const tokenResult =
      await currentUser.getIdTokenResult(true);

    const latestClaims = tokenResult.claims || {};

    setUser(currentUser);
    setClaims(latestClaims);

    return latestClaims;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setClaims({});
  }, []);

  const isAdmin = claims.admin === true;
  const isDeliveryBoy = claims.deliveryBoy === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        claims,
        isAdmin,
        isDeliveryBoy,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        refreshClaims,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
