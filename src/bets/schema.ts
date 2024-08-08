import {
  boolean,
  index,
  numeric,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const betsTable = pgTable(
  "bets",
  {
    id: uuid("id").primaryKey(),
    creator: varchar("creator", { length: 42 }).notNull(),
    creationTimestamp: numeric("creationTimestamp", {
      precision: 20,
    }).notNull(),
    acceptor: varchar("acceptor", { length: 42 }),
    acceptanceTimestamp: numeric("acceptanceTimestamp", { precision: 20 }),
    ticker: varchar("ticker", { length: 20 }).notNull(),
    metric: varchar("metric", { length: 40 }).notNull(),
    isBetOnUp: boolean("isBetOnUp").notNull(),
    expirationTimestamp: numeric("expirationTimestamp", {
      precision: 20,
    }).notNull(),
    value: numeric("value", { precision: 256 }).notNull(),
    currency: varchar("currency", { length: 42 }).notNull(),
    startingMetricValue: varchar("startingMetricValue", { length: 42 }),
    endingMetricValue: varchar("endingMetricValue", { length: 42 }),
    winner: varchar("winner", { length: 42 }),
    isWithdrawn: boolean("isWithdrawn").notNull().default(false),
    withdrawalTimestamp: numeric("withdrawalTimestamp", { precision: 20 }),
    lastActivityTimestamp: numeric("lastActivityTimestamp", {
      precision: 20,
    }).notNull(),
    winTimestamp: numeric("winTimestamp", { precision: 20 }),
    strikePriceCreator: varchar("strikePriceCreator", { length: 42 }),
    strikePriceAcceptor: varchar("strikePriceAcceptor", { length: 42 }),
    type: varchar("type", { length: 20 }).notNull().default("binary"),
    isPaid: boolean("isPaid").notNull().default(false),
    chain: varchar("chain", { length: 10 }).notNull().default("base"),
    paidTx: varchar("paidTx", { length: 66 }),
  },
  (table) => {
    return {
      idxCurrency: index("idx_currency").on(table.currency),
      idxTicker: index("idx_ticker").on(table.ticker),
      idxAcceptor: index("idx_acceptor").on(table.acceptor),
      idxCreator: index("idx_creator").on(table.creator),
      idxWinner: index("idx_winner").on(table.winner),
      idxExpirationTimestamp: index("idx_expirationTimestamp").on(
        table.expirationTimestamp,
      ),
      idxLastActivityTimestamp: index("idx_lastActivityTimestamp").on(
        table.lastActivityTimestamp,
      ),
      idxAcceptanceTimestamp: index("idx_acceptanceTimestamp").on(
        table.acceptanceTimestamp,
      ),
      idxWithdrawalTimestamp: index("idx_withdrawalTimestamp").on(
        table.withdrawalTimestamp,
      ),
      idxCreationTimestamp: index("idx_creationTimestamp").on(
        table.creationTimestamp,
      ),
      idxWinTimestamp: index("idx_winTimestamp").on(table.winTimestamp),
      idx_chain: index("idx_chain").on(table.chain),
      idx_type: index("idx_type").on(table.type),
    };
  },
);

export type BetEntity = typeof betsTable.$inferSelect;
export type BetInsertEntity = typeof betsTable.$inferInsert;
