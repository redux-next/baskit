"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

import { useDailyCartAuth } from "@/components/auth-provider";
import { auth } from "@/lib/firebase";

function Spinner({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

function BrandMark({ className = "", seamless = false }) {
  return (
    <Link
      href="/"
      aria-label="DailyCart home"
      className={`inline-flex w-fit items-center rounded-md focus-visible:outline-offset-4 ${className}`}
    >
      <Image
        src={
          seamless
            ? "/dailycart_login_logo.png"
            : "/dailycart_loading_logo.png"
        }
        alt="DailyCart"
        width={1914}
        height={636}
        priority
        className="h-auto w-[140px] object-contain sm:w-[184px]"
      />
    </Link>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
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
  );
}

function GroceryIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]" aria-hidden="true">
      <div className="absolute inset-x-10 bottom-5 h-16 rounded-full bg-[#1a6743]/10 blur-2xl" />
      <svg
        viewBox="0 0 560 350"
        className="relative h-auto w-full drop-shadow-[0_24px_32px_rgba(27,74,45,0.12)]"
        fill="none"
      >
        <ellipse cx="281" cy="301" rx="211" ry="25" fill="#DDEBDD" />
        <circle cx="159" cy="172" r="95" fill="#E0EFDC" />
        <circle cx="395" cy="184" r="108" fill="#E8F1D9" />
        <path d="M164 121h223l-19 169H183l-19-169Z" fill="#176344" />
        <path
          d="M218 128V96c0-29 21-51 49-51s49 22 49 51v32"
          stroke="#0E4D32"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M218 128V96c0-29 21-51 49-51s49 22 49 51v32"
          stroke="#F5FAF3"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M226 196c13-34 40-48 61-30 3-29 24-47 49-39 18 7 28 28 23 50-7 32-35 56-75 61-29 3-50-14-58-42Z" fill="#9BCB5A" />
        <path d="M287 166c-2 22-2 43 2 65" stroke="#E8F4D6" strokeWidth="4" strokeLinecap="round" />
        <path d="M332 127c13-22 34-28 48-15 13 13 9 37-8 54-17 16-43 21-61 8 2-17 8-34 21-47Z" fill="#F2B84B" />
        <path d="M331 169c8-12 17-22 29-34" stroke="#D18D2D" strokeWidth="3" strokeLinecap="round" />
        <path d="M160 184c-27-4-42-23-32-40 9-16 32-15 50 2 17 17 22 41 10 59-13-3-22-9-28-21Z" fill="#65A969" />
        <path d="M157 159c10 9 18 19 24 31" stroke="#D7EBD0" strokeWidth="3" strokeLinecap="round" />
        <rect x="376" y="215" width="48" height="72" rx="8" fill="#F0A05E" />
        <path d="M386 215v-12h28v12" stroke="#C87940" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="385" y="239" width="30" height="18" rx="5" fill="#FFE7C7" />
        <circle cx="126" cy="234" r="22" fill="#F0795D" />
        <path d="M126 211c1-8 7-13 14-13" stroke="#397B48" strokeWidth="5" strokeLinecap="round" />
        <path d="M123 214c-6-8-16-9-21-3 5 7 13 9 21 3Z" fill="#65A969" />
        <circle cx="441" cy="131" r="5" fill="#E6B456" />
        <circle cx="103" cy="103" r="4" fill="#82B66E" />
      </svg>
      <div className="absolute bottom-8 left-2 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-[0_10px_28px_rgba(24,66,40,0.12)] sm:left-0">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf6e9] text-[#176344]">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
            <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <span className="pr-1 text-left">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#78857a]">Delivering locally</span>
          <span className="mt-0.5 block text-xs font-semibold text-[#1b2d22]">Chabua, Assam</span>
        </span>
      </div>
      <div className="absolute right-2 top-7 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[11px] font-semibold tracking-wide text-[#176344] shadow-sm sm:right-6">
        FRESH · LOCAL · DAILY
      </div>
    </div>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const loginInProgress = useRef(false);
  const resetInProgress = useRef(false);

  const { user, loading, loginWithGoogle, loginWithEmail } =
    useDailyCartAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [loginMethod, setLoginMethod] = useState("");
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

  async function handleEmailLogin(event) {
    event.preventDefault();
    if (loginInProgress.current || resetInProgress.current) return;

    loginInProgress.current = true;
    try {
      setError("");
      setSuccess("");
      setLoginMethod("email");
      setSigningIn(true);

      await loginWithEmail(email.trim(), password);
      router.replace("/");
    } catch (err) {
      console.error("Email login error:", err);
      setError(getErrorMessage(err));
    } finally {
      loginInProgress.current = false;
      setSigningIn(false);
      setLoginMethod("");
    }
  }

  async function handleGoogleSignIn() {
    if (loginInProgress.current || resetInProgress.current) return;

    loginInProgress.current = true;
    try {
      setError("");
      setSuccess("");
      setLoginMethod("google");
      setSigningIn(true);

      await loginWithGoogle();
      router.replace("/");
    } catch (err) {
      console.error("Google login error:", err);
      setError(getErrorMessage(err));
    } finally {
      loginInProgress.current = false;
      setSigningIn(false);
      setLoginMethod("");
    }
  }

  async function handleForgotPassword() {
    if (signingIn || resetInProgress.current) return;
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    resetInProgress.current = true;
    try {
      setError("");
      setSuccess("");
      setResetting(true);

      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("Password reset link sent. Check your email.");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(getErrorMessage(err));
    } finally {
      resetInProgress.current = false;
      setResetting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f4f7f1] px-4 font-sans">
        <div className="auth-enter flex flex-col items-center text-center">
          <BrandMark className="mb-7" />
          <Spinner className="h-7 w-7 text-[#176344]" />
          <p className="mt-4 text-sm text-[#718074]">
            {user ? "Taking you to DailyCart..." : "Getting things ready..."}
          </p>
        </div>
      </main>
    );
  }

  const busy = signingIn || resetting;

  return (
    <main className="min-h-[100svh] bg-[#f4f7f1] px-4 py-2 font-sans sm:px-6 sm:py-6 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100svh-1rem)] w-full max-w-[1480px] grid-cols-1 overflow-hidden rounded-none border-0 bg-transparent shadow-none sm:min-h-[calc(100svh-3rem)] sm:rounded-[32px] sm:border sm:border-[#e7ece4] sm:bg-white sm:shadow-[0_24px_80px_rgba(32,64,39,0.08)] lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[720px] flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_18%_8%,#ffffff_0%,#f2f8ee_47%,#e8f2e7_100%)] p-10 lg:flex xl:p-14">
          <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full border border-[#d9e8d8]/70" />
          <div className="pointer-events-none absolute -right-20 top-32 h-56 w-56 rounded-full border border-[#d9e8d8]/70" />
          <div className="relative z-10">
            <BrandMark />
            <div className="mt-14 max-w-[520px] xl:mt-[4.5rem]">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.19em] text-[#64836b]">
                Fresh groceries. Everyday convenience.
              </p>
              <h1 className="max-w-[510px] text-[clamp(2.8rem,4.2vw,4.45rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-[#173c2b]">
                Freshness at
                <br />
                your doorstep<span className="text-[#43a66a]">.</span>
              </h1>
              <p className="mt-6 max-w-[440px] text-base leading-7 text-[#65776a] xl:text-[17px]">
                Your everyday groceries, fresh essentials, and daily needs —
                delivered right to your neighbourhood.
              </p>
            </div>
          </div>

          <div className="relative z-10 mx-[-1.5rem] mb-1 mt-2 xl:mx-[-2rem]">
            <GroceryIllustration />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4 border-t border-[#dce8da] pt-5 text-sm text-[#66796b]">
            <span className="font-medium">Your neighbourhood grocery partner.</span>
            <span className="shrink-0 rounded-full bg-white/75 px-3.5 py-2 text-xs font-semibold text-[#416849]">
              Proudly serving Chabua
            </span>
          </div>
        </section>

        <section className="flex min-w-0 flex-col items-center justify-center px-0 py-1 sm:px-4 sm:py-5 lg:px-8 xl:px-14">
          <div className="auth-enter mx-auto mb-2 flex w-full max-w-[460px] flex-col items-center text-center sm:mb-5 lg:hidden">
            <BrandMark className="mb-1 justify-center" seamless />
            <p className="text-xs leading-4 text-[#6d7d70]">
              Serving Chabua, Assam
            </p>
          </div>

          <div className="auth-enter auth-enter-delay w-full max-w-[460px] rounded-[24px] border border-[#e8ede7] bg-white p-5 shadow-[0_16px_46px_rgba(27,64,39,0.07)] max-[359px]:p-[18px] min-[375px]:p-6 sm:rounded-[28px] sm:p-6 lg:rounded-[28px] lg:border lg:border-[#e8ede7] lg:p-8 lg:shadow-[0_18px_42px_rgba(27,64,39,0.07)] xl:p-9">
            <header className="mb-4 text-center sm:mb-7 lg:text-left">
              <div className="mx-auto mb-2 hidden h-9 w-9 items-center justify-center rounded-2xl bg-[#edf6e9] text-[#176344] lg:mx-0 lg:mb-4 lg:inline-flex">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M5 10.5 12 5l7 5.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#1c3023] sm:text-[30px]">
                Welcome back
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#748076] sm:mt-1.5 sm:leading-6">
                Sign in to pick up where you left off.
              </p>
            </header>

            {error && (
              <div
                className="mb-5 flex gap-2.5 rounded-xl border border-[#f1d2cc] bg-[#fff7f5] px-3.5 py-3 text-sm leading-5 text-[#a34232] transition-all"
                role="alert"
                aria-live="assertive"
              >
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 6v4.5M10 13.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                className="mb-5 flex gap-2.5 rounded-xl border border-[#d5e8d5] bg-[#f3faf1] px-3.5 py-3 text-sm leading-5 text-[#316c41] transition-all"
                role="status"
                aria-live="polite"
              >
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m6.5 10 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4 sm:space-y-[18px]">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-[#33473a] sm:mb-2">
                  Email address
                </label>
                <div className="group relative">
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98a49a] transition-colors group-focus-within:text-[#28764c]" fill="none" aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m4.5 7 7.5 5.5L19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    inputMode="email"
                    aria-label="Email address"
                    className="h-12 w-full rounded-xl border border-[#dfe6de] bg-[#fcfdfb] pl-11 pr-4 text-base text-[#1b2d22] outline-none transition placeholder:text-sm placeholder:text-[#a0aaa1] hover:border-[#cbd8cc] focus:border-[#4e9a65] focus:bg-white focus:ring-4 focus:ring-[#eaf4e9] sm:h-[52px] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3 sm:mb-2">
                  <label htmlFor="login-password" className="text-[13px] font-semibold text-[#33473a]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="auth-small-button min-h-8 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetting ? "Sending link..." : "Forgot password?"}
                  </button>
                </div>
                <div className="group relative">
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98a49a] transition-colors group-focus-within:text-[#28764c]" fill="none" aria-hidden="true">
                    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                    className="h-12 w-full rounded-xl border border-[#dfe6de] bg-[#fcfdfb] pl-11 pr-14 text-base text-[#1b2d22] outline-none transition placeholder:text-sm placeholder:text-[#a0aaa1] hover:border-[#cbd8cc] focus:border-[#4e9a65] focus:bg-white focus:ring-4 focus:ring-[#eaf4e9] sm:h-[52px] sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="auth-password-toggle absolute right-2 top-1/2 flex min-h-10 min-w-12 -translate-y-1/2 items-center justify-center rounded-lg px-2 transition-colors hover:bg-[#eff5ed]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}
                className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#176344] px-5 text-sm font-semibold text-white shadow-[0_7px_16px_rgba(23,99,68,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#125638] hover:shadow-[0_10px_20px_rgba(23,99,68,0.22)] active:translate-y-0 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none sm:min-h-[52px]"
              >
                {signingIn && loginMethod === "email" ? (
                  <>
                    <Spinner />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="my-2 flex items-center gap-3 sm:my-6" aria-hidden="true">
              <span className="h-px flex-1 bg-[#e8ede7]" />
              <span className="text-[10px] font-semibold tracking-[0.14em] text-[#99a39a]">OR CONTINUE WITH</span>
              <span className="h-px flex-1 bg-[#e8ede7]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              style={{ color: "#344239", fontSize: "14px", fontWeight: 600 }}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dfe6de] bg-white px-5 text-sm font-semibold text-[#344239] transition duration-200 hover:border-[#cbd8cc] hover:bg-[#fafcf9] hover:shadow-[0_5px_14px_rgba(31,60,37,0.06)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[52px]"
            >
              {signingIn && loginMethod === "google" ? (
                <>
                  <Spinner className="text-[#4285F4]" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <GoogleMark />
                  Continue with Google
                </>
              )}
            </button>

            <p className="mt-3 text-center text-sm text-[#748076] sm:mt-6">
              New to DailyCart?{" "}
              <Link
                href="/register"
                className="rounded-sm font-semibold text-[#28764c] underline decoration-[#a8c9a9] underline-offset-4 transition-colors hover:text-[#155d38] hover:decoration-[#155d38]"
              >
                Create an account
              </Link>
            </p>
          </div>

          <p className="auth-short-screen-footer mt-3 max-w-[460px] text-center text-xs text-[#88958a] sm:mt-5 lg:mt-7">
            <span className="sm:hidden">Serving Chabua, Assam</span>
            <span className="hidden sm:inline">
              Your neighbourhood grocery partner · Serving Chabua, Assam
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
