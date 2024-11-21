import {
  boolean,
  index,
  pgTable,
  timestamp,
  varchar,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";

export const boxesTable = pgTable(
  "boxes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    isOpened: boolean("isOpened").notNull().default(false),
    player: varchar("player", { length: 44 }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    openedAt: timestamp("openedAt"),
    winningToken: varchar("winningToken", { length: 44 }),
    winningAmount: numeric("winningAmount", { precision: 50, scale: 0 }),
  },
  (table) => ({
    idxIsOpened: index("idx_isOpened").on(table.isOpened),
    idxPlayer: index("idx_player").on(table.player),
  }),
);

export type BoxEntity = typeof boxesTable.$inferSelect;
export type BoxInsertEntity = typeof boxesTable.$inferInsert;
