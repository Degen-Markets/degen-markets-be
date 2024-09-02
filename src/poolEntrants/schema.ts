import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const poolEntrantsTable = pgTable(
  "pool_entrants",
  {
    /** The solana address of the user */
    address: varchar("address", { length: 44 }).primaryKey(),

    /** The total points earned by the user */
    points: integer("points").notNull().default(0),
  },
  (table) => {
    return {
      idxPoints: index("idx_pool_entrant_points").on(table.points),
    };
  },
);

export type PoolEntrantEntity = typeof poolEntrantsTable.$inferSelect;
export type PoolEntrantInsertEntity = typeof poolEntrantsTable.$inferInsert;
