import Link from "next/link";

/**
 * QA fix: unknown URLs (and /catalog/<bad-slug>, which calls notFound()) showed
 * Next.js's built-in English "404: This page could not be found." page inside
 * the Hebrew RTL layout. This is the site's own Hebrew 404 with ways back.
 * HE: דף 404 בעברית במקום דף ברירת המחדל באנגלית, עם קישורים חזרה לאתר.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-7xl font-black text-brand-100">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">המנה הזו לא בתפריט</h1>
      <p className="mt-2 text-sm text-muted">העמוד שחיפשתם לא קיים או שהועבר. אפשר לחזור לתפריט ולהמשיך משם.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="flex h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-paper transition hover:bg-brand-500">
          לתפריט המלא
        </Link>
        <Link href="/" className="flex h-11 items-center rounded-full px-6 text-sm font-bold ring-1 ring-line transition hover:bg-brand-50">
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
