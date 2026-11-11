import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is only needed by commands that talk to the database
// (migrate, seed, studio). `prisma generate` — run on `npm install` and in CI —
// works without it, so fresh clones build with no .env.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
