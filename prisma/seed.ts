import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCategories, seedProducts, withSlugs } from "../src/data/catalog-seed";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  await prisma.storeSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  await prisma.user.upsert({
    where: { email: "admin@super-kai.local" },
    update: { role: "ADMIN" },
    create: { email: "admin@super-kai.local", name: "קאי", role: "ADMIN" },
  });

  const categoryIds = new Map<string, string>();
  for (const [i, c] of seedCategories.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon, portionGroup: c.portionGroup, sortOrder: i },
      create: { slug: c.slug, name: c.name, description: c.description, icon: c.icon, portionGroup: c.portionGroup, sortOrder: i },
    });
    categoryIds.set(c.slug, row.id);
  }

  for (const p of withSlugs(seedProducts)) {
    const { slug, sortOrder } = p;
    const saleUnit = p.saleUnit ?? "KG";
    const data = {
      name: p.name,
      description: p.description ?? null,
      imageUrl: p.imageUrl ?? null, // generated photos are resolved from public/products at read time
      aiImagePrompt: p.aiImagePrompt ?? null,
      categoryId: categoryIds.get(p.categorySlug)!,
      saleUnit,
      priceAgorot: Math.round(p.price * 100),
      unitWeightGrams: p.unitWeightGrams ?? null,
      unitLabel: p.unitLabel ?? null,
      hasBones: !!p.hasBones,
      minQuantity: saleUnit === "KG" ? 0.25 : 1,
      quantityStep: saleUnit === "KG" ? 0.25 : 1,
      stockStatus: p.outOfStock ? ("OUT_OF_STOCK" as const) : ("IN_STOCK" as const),
      isFeatured: !!p.featured,
      sortOrder,
      dietary: p.dietary ?? [],
    };
    const product = await prisma.product.upsert({ where: { slug }, update: data, create: { slug, ...data } });

    if (p.promoPercent) {
      await prisma.promotion.deleteMany({ where: { productId: product.id } });
      await prisma.promotion.create({
        data: {
          title: `${p.promoPercent}% הנחה`,
          type: "PERCENT_OFF",
          value: p.promoPercent,
          productId: product.id,
          startsAt: new Date(),
        },
      });
    }
  }
  console.log(`Seeded ${seedCategories.length} categories and ${seedProducts.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
