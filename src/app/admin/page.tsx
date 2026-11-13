"use client";

import { AccountGate } from "@/components/auth/AccountGate";

const sections = [
  { title: "מוצרים", text: "הוספה ועריכה של מנות, מחירים, תמונות ומלאי." },
  { title: "מבצעים והנחות", text: "הנחה על מנה או על קטגוריה שלמה, לפי תאריכים." },
  { title: "הזמנות", text: "ההזמנות לפי יום אספקה, סטטוס וסיכום יומי." },
];

/** Admin landing page. The management screens themselves are not built yet. */
export default function AdminPage() {
  return (
    <AccountGate adminOnly>
      {(user) => (
        <div className="mx-auto max-w-5xl px-4 py-14">
          <p className="text-sm font-bold text-leaf-600">שלום, {user.name}</p>
          <h1 className="font-display text-4xl font-bold">ניהול אתר</h1>
          <p className="mt-2 text-sm text-muted">מסכי הניהול עדיין בבנייה. אלה האזורים שיופיעו כאן:</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {sections.map((s) => (
              <li key={s.title} className="rounded-3xl bg-paper p-6 ring-1 ring-line">
                <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-bold text-leaf-700">בקרוב</span>
                <h2 className="mt-3 font-display text-xl font-bold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AccountGate>
  );
}
