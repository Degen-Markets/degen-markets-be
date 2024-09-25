import { pgTable, varchar, index } from "drizzle-orm/pg-core";
import { playersTable } from "../players/schema";
import { poolsTable } from "../pools/schema";

export const poolSharingTweetsTable = pgTable(
  "pool_sharing_tweets",
  {
    /** The tweet id (https://x.com/DampTriathlon/status/${tweetId}) */
    tweetId: varchar("tweetId", { length: 100 }).primaryKey(),

    /** The address of the pool shared by the player */
    pool: varchar("pool", { length: 44 })
      .notNull()
      .references(() => poolsTable.address),

    /** The address of the player who shared the tweet */
    player: varchar("player", { length: 44 })
      .notNull()
      .references(() => playersTable.address),
  },
  (table) => ({
    idxPool: index("idx_pool_sharing_tweets_pool").on(table.pool),
    idxPlayer: index("idx_pool_sharing_tweets_player").on(table.player),
  }),
);

export type PoolSharingTweetEntity = typeof poolSharingTweetsTable.$inferSelect;
export type PoolSharingTweetInsertEntity =
  typeof poolSharingTweetsTable.$inferInsert;
