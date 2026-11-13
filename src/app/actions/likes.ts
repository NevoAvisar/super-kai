"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getProducts } from "@/lib/catalog";
import { likeStore } from "@/lib/likes";
import type { LikeSummary } from "@/lib/like-store";

const VISITOR_COOKIE = "sk_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_IDS = 50;

/** Like counts for these dishes, plus which of them this visitor likes. */
export async function getDishLikes(productIds: string[]): Promise<LikeSummary> {
  if (!Array.isArray(productIds)) return { counts: {}, mine: [] };
  const ids = [...new Set(productIds.filter((id) => typeof id === "string"))].slice(0, MAX_IDS);
  const visitorId = (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
  return likeStore.summary(ids, visitorId);
}

/** Set this visitor's like on a dish (idempotent). Creates the visitor cookie on first like. */
export async function setDishLike(productId: string, liked: boolean): Promise<{ count: number; liked: boolean }> {
  const exists = typeof productId === "string" && (await getProducts()).some((p) => p.id === productId);
  if (!exists) throw new Error("Unknown product");

  const jar = await cookies();
  let visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    jar.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/",
    });
  }
  const count = await likeStore.set(productId, visitorId, !!liked);
  return { count, liked: !!liked };
}
