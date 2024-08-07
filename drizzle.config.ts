import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./resources/db/schema.ts",
  out: "./resources/db/migrations/temp",
  dialect: "postgresql",
});
