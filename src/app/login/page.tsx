import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { LoginShowcase, type ShowcaseSlide } from "@/components/auth/LoginShowcase";
import { CHEF, WELCOME } from "@/data/dish-orbit";
import { getHeroDishes } from "@/lib/hero-dishes";

export const metadata: Metadata = { title: "התחברות" };

/** Split screen: the login card, and the home page's orbit plates on autoplay. */
export default async function LoginPage() {
  const dishes = await getHeroDishes(1).catch(() => []);
  const slides: ShowcaseSlide[] = [
    { key: "welcome", eyebrow: WELCOME.eyebrow, title: WELCOME.title, text: WELCOME.story, accent: WELCOME.accent, imageUrl: null },
    {
      key: "kitchen",
      eyebrow: `השף ${CHEF.name} · ${CHEF.role}`,
      title: "המטבח נפתח כל בוקר מחדש.",
      text: WELCOME.pillars.map((p) => `${p.title} – ${p.text}`).join(". ") + ".",
      accent: "#6b7740",
      imageUrl: null,
    },
    ...dishes.map((d) => ({
      key: d.product.slug,
      eyebrow: d.categoryName,
      title: d.product.name,
      text: d.product.description ?? d.servingGuide,
      accent: d.accent,
      imageUrl: d.product.imageUrl,
    })),
  ];

  return (
    <div dir="rtl" className="grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="lg:order-2">
        <LoginShowcase slides={slides} />
      </div>
      <div className="flex items-center justify-center px-4 py-10 lg:py-16">
        <AuthForm
          logo={
            <p className="mb-4 font-display text-2xl font-bold text-ink">
              סופר<span className="text-brand-500">-</span>קאי
            </p>
          }
        />
      </div>
    </div>
  );
}

// Same cadence as the home page: the dish line-up follows what customers order and like.
export const revalidate = 60;
