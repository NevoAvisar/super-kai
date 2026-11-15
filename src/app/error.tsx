"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * QA fix: there was no error boundary, so any render error (e.g. the catalog DB
 * being unreachable in CATALOG_SOURCE="db" mode) showed Next's generic English
 * error screen. The cart lives in localStorage, so "try again" loses nothing.
 * HE: גבול שגיאה בעברית. הסל שמור בדפדפן ולכן "לנסות שוב" לא מוחק אותו.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">משהו השתבש במטבח</h1>
      <p className="mt-2 text-sm text-muted">לא הצלחנו לטעון את העמוד. הסל שלך שמור – אפשר לנסות שוב.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="flex h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-paper transition hover:bg-brand-500">
          לנסות שוב
        </button>
        <Link href="/" className="flex h-11 items-center rounded-full px-6 text-sm font-bold ring-1 ring-line transition hover:bg-brand-50">
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
