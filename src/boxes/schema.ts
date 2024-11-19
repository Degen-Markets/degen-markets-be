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
    isOpened: boolean("isOpened").notNull().default(false),
    player: varchar("player", { length: 44 }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    openedAt: timestamp("openedAt"),
    winningToken: varchar("winningToken", { length: 44 }),
    winningAmount: integer("winningAmount"),
  },
  (table) => ({
    idxPlayer: index("idx_player").on(table.player),
  }),
);

export type BoxEntity = typeof boxesTable.$inferSelect;
export type BoxInsertEntity = typeof boxesTable.$inferInsert;
