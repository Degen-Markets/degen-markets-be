import { pgTable, varchar, index } from "drizzle-orm/pg-core";
import { playersTable } from "../players/schema";

export const poolSharingTweetsTable = pgTable(
  "pool_sharing_tweets",
  {
    /** The tweet id (https://x.com/DampTriathlon/status/${tweetId}) */
    tweetId: varchar("tweetId", { length: 100 }).primaryKey(),

    /** The address of the pool shared by the player */
    poolId: varchar("poolId", { length: 44 }).notNull(),

    /** The address of the player who shared the tweet */
    playerAddress: varchar("playerAddress", { length: 44 })
      .notNull()
      .references(() => playersTable.address),
  },
  (table) => ({
    idxPoolId: index("idx_poolId").on(table.poolId),
    idxPlayerAddress: index("idx_playerAddress").on(table.playerAddress),
  }),
);

export type PoolSharingTweetEntity = typeof poolSharingTweetsTable.$inferSelect;
export type PoolSharingTweetInsertEntity =
  typeof poolSharingTweetsTable.$inferInsert;
