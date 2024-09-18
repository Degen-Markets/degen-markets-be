import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const playersTable = pgTable(
  "players",
  {
    /** The solana address of the user */
    address: varchar("address", { length: 44 }).primaryKey(),

    /** The total points earned by the user */
    points: integer("points").notNull().default(0),

    /** The user's twitter username (max length: https://help.x.com/en/managing-your-account/x-username-rules) */
    twitterUsername: varchar("twitterUsername", { length: 15 }),

    /** The user's twitter profile picture url */
    twitterPfpUrl: varchar("twitterPfpUrl"),

    twitterId: varchar("twitterId", { length: 30 }).unique(),
  },
  (table) => ({
    idxTwitterId: index("idx_twitterId").on(table.twitterId),
  }),
);

export type PlayerEntity = typeof playersTable.$inferSelect;
export type PlayerInsertEntity = typeof playersTable.$inferInsert;
