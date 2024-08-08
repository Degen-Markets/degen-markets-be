import { playersTable } from "./schema";

export type PlayerEntity = typeof playersTable.$inferSelect;
export type PlayerInsertEntity = typeof playersTable.$inferInsert;
