"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { getFirebaseClientAuth, googleAuthProvider, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { useStore } from "@/components/providers/StoreProviders";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextPath = sp.get("next") || "/account";
  const { refreshAuthAndCart, toast } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);

  const exchangeSession = async (idToken: string) => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Sign in failed.");
    }
    await refreshAuthAndCart();
    toast("Welcome back to AURA!");
    router.push(nextPath);
    router.refresh();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerify(false);

    if (!isFirebaseClientConfigured()) {
      setError("Authentication is not configured yet. Please check environment settings.");
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!cred.user.emailVerified) {
        setNeedsVerify(true);
      }
      const idToken = await cred.user.getIdToken(true);
      await exchangeSession(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    if (!isFirebaseClientConfigured()) {
      setError("Authentication is not configured yet.");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseClientAuth();
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken(true);
      await exchangeSession(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const auth = getFirebaseClientAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast("Verification email sent!");
      }
    } catch {
      toast("Could not resend verification email right now.", "error");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="border border-neutral-200 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">AURA Fashion House</p>
          <h1 className="text-2xl font-bold mt-1">Sign In</h1>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {needsVerify && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2">
            <span>Your email is not verified yet.</span>
            <button
              type="button"
              onClick={handleResendVerification}
              className="underline font-semibold shrink-0"
            >
              Resend link
            </button>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#c2410c] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 w-full" />
          <span className="bg-white px-3 text-xs text-neutral-400 uppercase">or</span>
          <div className="border-t border-neutral-200 w-full" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-sm font-medium flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>

        <p className="text-center text-xs text-neutral-600">
          New to AURA?{" "}
          <Link href="/register" className="text-[#c2410c] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
