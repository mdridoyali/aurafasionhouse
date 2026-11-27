"use client";

import React from "react";

export default function GlobalErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-neutral-600">
        We hit a temporary issue loading this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-semibold"
      >
        Try Again
      </button>
    </div>
  );
}
