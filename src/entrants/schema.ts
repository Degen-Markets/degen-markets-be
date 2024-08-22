import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

// ASK_ANGAD: Which do you prefer entrants or betEntrants? The former feels slightly ambiguous
export const entrantsTable = pgTable(
  "entrants",
  {
    // TODO: Add pre-post-hooks to lowercase the addresses, and .$type<Address>() it
    // ASK_ANGAD: Should I name the field `address`?
    /** The solana address of the user */
    id: varchar("id", { length: 44 }).primaryKey(),

    /** The total points earned by the user */
    points: integer("points").notNull().default(0),
  },
  (table) => {
    return {
      idxPoints: index("idx_points").on(table.points),
    };
  },
);

export type EntrantEntity = typeof entrantsTable.$inferSelect;
export type EntrantInsertEntity = typeof entrantsTable.$inferInsert;
