"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail, UserRound } from "lucide-react";
import { useAuth, type AuthResult, type SocialProvider } from "@/context/AuthContext";

type Mode = "login" | "signup";
type Pending = "google" | "apple" | "password" | null;
type Notice = { kind: "error" | "success"; text: string } | null;

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-cream/60 text-right text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-paper focus:ring-2 focus:ring-brand-100 disabled:opacity-60";
const socialClass =
  "flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-paper text-sm font-medium text-ink transition hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.03-2.75 2.25-4.07 2.35-4.14-1.28-1.87-3.27-2.13-3.98-2.16-1.69-.17-3.3 1-4.16 1-.86 0-2.18-.97-3.59-.95-1.84.03-3.54 1.07-4.49 2.72-1.92 3.32-.49 8.23 1.37 10.93.91 1.32 2 2.8 3.42 2.75 1.37-.06 1.89-.89 3.55-.89 1.66 0 2.12.89 3.57.86 1.48-.03 2.41-1.34 3.31-2.67 1.04-1.53 1.47-3.01 1.5-3.09-.03-.01-2.87-1.1-2.9-4.36zM14.33 4.46c.75-.92 1.26-2.19 1.12-3.46-1.09.04-2.4.73-3.18 1.64-.7.81-1.31 2.1-1.15 3.34 1.21.09 2.45-.62 3.21-1.52z" />
    </svg>
  );
}

function Spinner() {
  return <LoaderCircle className="size-4 animate-spin" aria-hidden />;
}

/** Login / sign-up card: Google / Apple, or email + password. All copy is Hebrew, laid out RTL. */
export function AuthForm({ logo }: { logo?: ReactNode }) {
  const router = useRouter();
  const { user, ready, signInWithEmail, signUpWithEmail, signInWithSocial } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const busy = pending !== null;

  // Signed in (just now, or already) → leave the login page. The spinner stays until then.
  useEffect(() => {
    if (ready && user) router.replace(user.role === "admin" ? "/admin" : "/");
  }, [ready, user, router]);

  async function run(kind: Exclude<Pending, null>, action: () => Promise<AuthResult>) {
    setNotice(null);
    setPending(kind);
    const result = await action();
    if (result.ok) return;
    setNotice({ kind: "error", text: result.error });
    setPending(null);
  }

  const signInWith = (provider: SocialProvider) => run(provider, () => signInWithSocial(provider));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run("password", () => (signup ? signUpWithEmail(name, email, password) : signInWithEmail(email, password)));
  }

  function onForgotPassword() {
    setNotice({ kind: "success", text: "האתר במצב הדגמה ולא שולח מיילים. אפשר להירשם עם כתובת אימייל אחרת." });
  }

  return (
    <div dir="rtl" className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-[0_30px_60px_-40px_rgba(50,30,10,0.35)] ring-1 ring-line sm:p-8">
      <header className="text-center">
        {logo}
        <h1 className="font-display text-3xl font-bold">{signup ? "הרשמה לסופר-קאי" : "התחברות לסופר-קאי"}</h1>
        <p className="mt-1 text-sm text-muted">
          {signup ? "פותחים חשבון בחצי דקה – ומזמינים מהר יותר בפעם הבאה." : "ההזמנות, הכתובות והמנות האהובות – במקום אחד."}
        </p>
      </header>

      <p className="mb-3 mt-7 text-center text-xs font-medium text-muted">{signup ? "הרשמה מהירה באמצעות" : "התחברות מהירה באמצעות"}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={socialClass} disabled={busy} onClick={() => signInWith("google")}>
          {pending === "google" ? <Spinner /> : <GoogleIcon />}
          Google
        </button>
        <button type="button" className={socialClass} disabled={busy} onClick={() => signInWith("apple")}>
          {pending === "apple" ? <Spinner /> : <AppleIcon />}
          Apple
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        או
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" aria-busy={busy}>
        {signup && (
          <div className="space-y-1.5">
            <label htmlFor="login-name" className="text-sm font-medium">
              שם מלא
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="login-name"
                type="text"
                autoComplete="name"
                required
                disabled={busy}
                placeholder="ישראל ישראלי"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} pl-3 pr-9`}
              />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium">
            אימייל
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="login-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              inputMode="email"
              required
              disabled={busy}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-3 pr-9`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium">
              סיסמה
            </label>
            {signup ? (
              <span className="text-xs text-muted">8 תווים לפחות</span>
            ) : (
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-60"
              >
                  שכחתי סיסמה?
              </button>
            )}
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 8 : undefined}
              required
              disabled={busy}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pl-10 pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
              aria-pressed={showPassword}
              className="absolute left-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-brand-50 hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </div>

        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={
              notice.kind === "error"
                ? "rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-700 ring-1 ring-brand-100"
                : "rounded-xl bg-leaf-50 px-3 py-2.5 text-sm text-leaf-700"
            }
          >
            {notice.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending === "password" && <Spinner />}
          {signup ? "הרשמה" : "התחבר"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {signup ? "כבר יש לך חשבון?" : "עדיין אין לך חשבון?"}{" "}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setMode(signup ? "login" : "signup");
            setNotice(null);
          }}
          className="font-bold text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-60"
        >
          {signup ? "התחברות" : "הרשמה"}
        </button>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        {signup ? "בהרשמה" : "בהתחברות"}, הנך מאשר/ת את תנאי השימוש ומדיניות הפרטיות
      </p>
    </div>
  );
}
