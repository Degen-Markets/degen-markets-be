import { index, numeric, pgTable, varchar, boolean } from "drizzle-orm/pg-core";
import { playersTable } from "../players/schema";

// Define Pools Table
export const poolsTable = pgTable(
  "pools",
  {
    id: varchar("id", { length: 44 }).primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 5000 }),
    image: varchar("image", { length: 1000 }),
    isPaused: boolean("is_paused"), // Field can be true, false, or null (we can add .notNull() for true, false only)
    winningOption: varchar("winning_option", { length: 44 }), // Foreign key to winning option
    value: numeric("value", { precision: 50, scale: 0 }).notNull(), // Total value in the pool
  },
  (table) => {
    return {
      idxWinningOption: index("idx_winning_option").on(table.winningOption),
    };
  },
);

export const poolOptionsTable = pgTable(
  "pool_options",
  {
    id: varchar("id", { length: 44 }).primaryKey(), // Option ID
    poolId: varchar("pool_id", { length: 44 })
      .notNull()
      .references(() => poolsTable.id), // Foreign key to poolsTable (each option belongs to a pool)
    title: varchar("title", { length: 255 }).notNull(), // Option title
    value: numeric("value", { precision: 50, scale: 0 }).notNull(), // Total value in the option
  },
  (table) => {
    return {
      idxPoolId: index("idx_pool_id").on(table.poolId),
    };
  },
);

export const poolEntriesTable = pgTable(
  "pool_entries",
  {
    /** The solana address of the entry account */
    address: varchar("address", { length: 44 }).primaryKey(),

    /** The solana address of the user who entered the bet */
    entrant: varchar("entrant", { length: 44 })
      .notNull()
      .references(() => playersTable.address), // Foreign key to playersTable

    /** The solana address of the option account */
    option: varchar("option", { length: 44 })
      .notNull()
      .references(() => poolOptionsTable.id), // Foreign key to poolOptionsTable

    /** The solana address of the pool account */
    pool: varchar("pool", { length: 44 })
      .notNull()
      .references(() => poolsTable.id), // Foreign key to poolsTable

    /** The total value (money) in this specific entry */
    value: numeric("value", { precision: 50, scale: 0 }).notNull(), // Total value in the entry
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
