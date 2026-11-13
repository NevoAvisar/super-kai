import "server-only";
import { createMemoryLikeStore, type LikeStore } from "./like-store";

const useDb = process.env.CATALOG_SOURCE === "db";

const dbStore: LikeStore = {
  async summary(productIds, visitorId) {
    const { prisma } = await import("./db");
    const [groups, mine] = await Promise.all([
      prisma.productLike.groupBy({ by: ["productId"], where: { productId: { in: productIds } }, _count: true }),
      visitorId
        ? prisma.productLike.findMany({ where: { visitorId, productId: { in: productIds } }, select: { productId: true } })
        : [],
    ]);
    return {
      counts: Object.fromEntries(groups.map((g) => [g.productId, g._count])),
      mine: mine.map((m) => m.productId),
    };
  },
  async set(productId, visitorId, liked) {
    const { prisma } = await import("./db");
    if (liked) await prisma.productLike.createMany({ data: [{ productId, visitorId }], skipDuplicates: true });
    else await prisma.productLike.deleteMany({ where: { productId, visitorId } });
    return prisma.productLike.count({ where: { productId } });
  },
};

// Keep the in-memory store across hot reloads in development.
const globalForLikes = globalThis as unknown as { likeStore?: LikeStore };
const memoryStore = (globalForLikes.likeStore ??= createMemoryLikeStore());

export const likeStore: LikeStore = useDb ? dbStore : memoryStore;
