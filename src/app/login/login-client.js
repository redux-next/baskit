
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

import { useDailyCartAuth } from "@/components/auth-provider";
import { auth } from "@/lib/firebase";

export default function LoginClient() {
  const router = useRouter();

  const {
    user,
    loading,
    loginWithGoogle,
    loginWithEmail,
  } = useDailyCartAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [signingIn, setSigningIn] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  function getErrorMessage(err) {
    switch (err.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase.";

      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled. Please try again.";

      default:
        return err.message || "Something went wrong. Please try again.";
    }
  }

  async function handleEmailLogin(e) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSigningIn(true);

      await loginWithEmail(email.trim(), password);

      router.replace("/");
    } catch (err) {
      console.error("Email login error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSigningIn(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setSuccess("");
      setSigningIn(true);

      await loginWithGoogle();

      router.replace("/");
    } catch (err) {
      console.error("Google login error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSigningIn(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setResetting(true);

      await sendPasswordResetEmail(auth, email.trim());

      setSuccess("Password reset link sent! Check your email.");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <div className="text-center">
          <div className="h-9 w-9 mx-auto rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            {user ? "Taking you to DailyCart..." : "Loading..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        <section className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-green-900/5 p-7 sm:p-9">
          <div className="text-center mb-8">
        <Link
          href="/"
          aria-label="DailyCart home"
          className="flex items-center justify-center mb-8"
          style={{
            margin: "0 auto 32px",
            padding: 0,
            width: "180px",
            height: "55px",
            overflow: "hidden",
            backgroundColor: "#f6f8f4",
            borderRadius: "6px",
            lineHeight: 0,
            textDecoration: "none",
          }}
        >
          <Image
            src="/dailycart_loading_logo.png"
            alt="DailyCart"
            width={220}
            height={74}
            priority
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              margin: 0,
              padding: 0,
            }}
          />
        </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to DailyCart
            </h1>

            <p className="text-sm text-gray-500 mt-2 leading-6">
              Fresh groceries, everyday essentials, and more.
              Sign in to get started.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting || signingIn}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                >
                  {resetting ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-green-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn || resetting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Email"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || resetting}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              viewBox="0 0 48 48"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.89 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            Continue with Google
          </button>

          <div className="mt-7 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-green-700 hover:text-green-800"
              >
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-7 text-center text-green-700">
            <b>Chabua Only!</b>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 mt-7">
          Freshness delivered to your doorstep.
        </p>
      </div>
    </main>
  );
}
