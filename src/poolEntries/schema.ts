import { bigint, index, pgTable, varchar } from "drizzle-orm/pg-core";
import { poolEntrantsTable } from "../poolEntrants/schema";

export const poolEntriesTable = pgTable(
  "poolEntries",
  {
    /** The solana address of the entry account */
    address: varchar("address", { length: 44 }).primaryKey(),

    /** The solana address of the user who entered the bet */
    entrant: varchar("entrant", { length: 44 })
      .notNull()
      .references(() => poolEntrantsTable.address),

    /** The solana address of the option account (PDA associated to the pools program)*/
    option: varchar("option", { length: 44 }).notNull(),

    /** The solana address of the pool account (PDA associated to the pools program)*/
    pool: varchar("pool", { length: 44 }).notNull(),

    /** The total value (money) in this specific entry */
    value: bigint("value", { mode: "bigint" }).notNull(),
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
