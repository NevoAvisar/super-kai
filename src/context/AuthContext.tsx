"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CustomerAddress } from "@/lib/il-address/validate";

/**
 * LOCAL MOCK AUTHENTICATION — for trying the site without a backend.
 *
 * Users, passwords and the session live in this browser's localStorage, and
 * the admin account below is hard-coded. Nothing here is secure: anyone can
 * read or edit it from dev tools. Replace with real auth (see lib/supabase.ts)
 * before the site takes real customers or exposes real admin actions.
 */

export type Role = "admin" | "customer";
export type SocialProvider = "google" | "apple";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
  provider: "password" | SocialProvider;
  phone?: string;
  /** Verified against the official cities-and-streets list (admin/customers/actions.ts). */
  address?: CustomerAddress;
}

interface StoredUser extends AuthUser {
  password: string;
}

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  /** False until localStorage has been read (avoids a logged-out flash). */
  ready: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInWithSocial: (provider: SocialProvider) => Promise<AuthResult>;
  signOut: () => void;
}

const SESSION_KEY = "sk_auth_user";
const USERS_KEY = "sk_auth_users";

const ADMIN: StoredUser = {
  email: "admin@superkai.co.il",
  password: "123456",
  name: "מנהל סופר-קאי",
  role: "admin",
  provider: "password",
};

const SOCIAL: Record<SocialProvider, AuthUser> = {
  google: { email: "google-demo@superkai.co.il", name: "משתמש Google", role: "customer", provider: "google" },
  apple: { email: "apple-demo@superkai.co.il", name: "משתמש Apple", role: "customer", provider: "apple" },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / storage full: the session then lasts until the tab reloads.
  }
}

const strip = ({ password: _password, ...user }: StoredUser): AuthUser => user;
const normalize = (email: string) => email.trim().toLowerCase();
/** A short pause so the buttons' loading state is visible, like a real request. */
const pause = () => new Promise((r) => setTimeout(r, 450));

/**
 * Admin screen helpers (mock): the registered customer accounts in this
 * browser, without passwords, and a way for the admin to add one. With a real
 * backend these become admin-only server actions over the User table.
 */
export type CustomerAccount = Omit<AuthUser, "role">;

export function listCustomerAccounts(): CustomerAccount[] {
  return read<StoredUser[]>(USERS_KEY, [])
    .filter((u) => u.role === "customer")
    .map(({ password: _password, role: _role, ...account }) => account);
}

export const isEmailTaken = (rawEmail: string) => {
  const email = normalize(rawEmail);
  return email === ADMIN.email || read<StoredUser[]>(USERS_KEY, []).some((u) => u.email === email);
};

/** Store a verified address on a registered customer; false when there is no such account. */
export function setCustomerAddress(rawEmail: string, address: CustomerAddress): boolean {
  const email = normalize(rawEmail);
  const users = read<StoredUser[]>(USERS_KEY, []);
  if (!users.some((u) => u.email === email && u.role === "customer")) return false;
  write(USERS_KEY, users.map((u) => (u.email === email ? { ...u, address } : u)));
  return true;
}

export function addCustomerAccount(input: { name: string; email: string; phone?: string; password: string; address?: CustomerAddress }): { ok: true } | { ok: false; error: string } {
  const email = normalize(input.email);
  const users = read<StoredUser[]>(USERS_KEY, []);
  if (email === ADMIN.email || users.some((u) => u.email === email)) {
    return { ok: false, error: "כתובת האימייל הזו כבר רשומה." };
  }
  const created: StoredUser = {
    email,
    password: input.password,
    name: input.name.trim() || email.split("@")[0],
    role: "customer",
    provider: "password",
    ...(input.phone?.trim() && { phone: input.phone.trim() }),
    ...(input.address && { address: input.address }),
  };
  write(USERS_KEY, [...users, created]);
  return { ok: true };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUser(read<AuthUser | null>(SESSION_KEY, null));
    setReady(true);
    // Logging in or out in another tab updates this one.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === null) setUser(read<AuthUser | null>(SESSION_KEY, null));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const notify = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const start = useCallback(
    (next: AuthUser): AuthResult => {
      write(SESSION_KEY, next);
      setUser(next);
      notify(`התחברת בהצלחה. שלום, ${next.name}!`);
      return { ok: true, user: next };
    },
    [notify],
  );

  const signInWithEmail = useCallback(
    async (rawEmail: string, password: string): Promise<AuthResult> => {
      await pause();
      const email = normalize(rawEmail);
      const users = read<StoredUser[]>(USERS_KEY, []);
      const known = email === ADMIN.email ? ADMIN : users.find((u) => u.email === email);
      if (known) {
        return known.password === password ? start(strip(known)) : { ok: false, error: "האימייל או הסיסמה שגויים." };
      }
      // Demo behaviour: an unknown email is registered on the spot as a customer.
      const created: StoredUser = { email, password, name: email.split("@")[0], role: "customer", provider: "password" };
      write(USERS_KEY, [...users, created]);
      return start(strip(created));
    },
    [start],
  );

  const signUpWithEmail = useCallback(
    async (name: string, rawEmail: string, password: string): Promise<AuthResult> => {
      await pause();
      const email = normalize(rawEmail);
      const users = read<StoredUser[]>(USERS_KEY, []);
      if (email === ADMIN.email || users.some((u) => u.email === email)) {
        return { ok: false, error: "כתובת האימייל הזו כבר רשומה. אפשר להתחבר איתה." };
      }
      const created: StoredUser = { email, password, name: name.trim() || email.split("@")[0], role: "customer", provider: "password" };
      write(USERS_KEY, [...users, created]);
      return start(strip(created));
    },
    [start],
  );

  const signInWithSocial = useCallback(
    async (provider: SocialProvider): Promise<AuthResult> => {
      await pause();
      return start(SOCIAL[provider]);
    },
    [start],
  );

  const signOut = useCallback(() => {
    write(SESSION_KEY, null);
    setUser(null);
    notify("התנתקת מהחשבון. להתראות!");
  }, [notify]);

  const value = useMemo(
    () => ({ user, ready, signInWithEmail, signUpWithEmail, signInWithSocial, signOut }),
    [user, ready, signInWithEmail, signUpWithEmail, signInWithSocial, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_40px_-20px_rgba(50,30,10,0.6)]">
            {toast}
          </p>
        )}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
