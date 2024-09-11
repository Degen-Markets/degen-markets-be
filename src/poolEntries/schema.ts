import { index, numeric, pgTable, varchar } from "drizzle-orm/pg-core";
import { playersTable } from "../players/schema";

export const poolEntriesTable = pgTable(
  "pool_entries",
  {
    /** The solana address of the entry account */
    address: varchar("address", { length: 44 }).primaryKey(),

    /** The solana address of the user who entered the bet */
    entrant: varchar("entrant", { length: 44 })
      .notNull()
      .references(() => playersTable.address),

    /** The solana address of the option account (PDA associated to the pools program)*/
    option: varchar("option", { length: 44 }).notNull(),

    /** The solana address of the pool account (PDA associated to the pools program)*/
    pool: varchar("pool", { length: 44 }).notNull(),

    /** The total value (money) in this specific entry */
    value: numeric("value", {
      precision: 50, // biggest number in rust is u128, so 50 precision gives us plenty of space
      scale: 0, // 0 scale because we do not want any decimals
    }).notNull(),
  },
  (table) => {
    return {
      idxEntrant: index("idx_entrant").on(table.entrant),
      idxOption: index("idx_option").on(table.option),
      idxPool: index("idx_pool").on(table.pool),
    };
  },
);

export type PoolEntriesEntity = typeof poolEntriesTable.$inferSelect;
export type PoolEntriesInsertEntity = typeof poolEntriesTable.$inferInsert;
