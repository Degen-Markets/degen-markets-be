import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const playersTable = pgTable(
  "players",
  {
    address: varchar("address").primaryKey(),
    name: varchar("name", { length: 20 }),
    avatarUrl: text("avatarUrl"),
    chain: varchar("chain", { length: 20 }).notNull().default("base"),
    points: integer("points").notNull().default(0),
  },
  (table) => {
    return {
      idxPoints: index("idx_points").on(table.points),
    };
  },
);

export type PlayerEntity = typeof playersTable.$inferSelect;
export type PlayerInsertEntity = typeof playersTable.$inferInsert;
