import {
  boolean,
  index,
  pgTable,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const boxesTable = pgTable(
  "boxes",
  {
    isOpened: boolean("is_opened").notNull().default(false),
    player: varchar("player", { length: 44 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    openedAt: timestamp("opened_at"),
    winningToken: varchar("winning_token", { length: 44 }),
    winningAmount: integer("winning_amount"),
  },
  (table) => ({
    idxPlayer: index("idx_player").on(table.player),
  }),
);

export type BoxEntity = typeof boxesTable.$inferSelect;
export type BoxInsertEntity = typeof boxesTable.$inferInsert;
