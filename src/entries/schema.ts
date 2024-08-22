import { bigint, index, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { entrantsTable } from "../entrants/schema";

// ASK_ANGAD: Which do you prefer entries or betEntries? The former feels slightly ambiguous
export const entriesTable = pgTable(
  "entries",
  {
    // TODO: Add pre-post-hooks to lowercase the addresses, and .$type<Address>() it
    /** The solana address of the entry account */
    id: varchar("id", { length: 44 }).primaryKey(),

    /** The solana address of the user who entered the bet */
    entrant: varchar("entrant", { length: 44 })
      .notNull()
      .references(() => entrantsTable.id),

    // ASK_ANGAD: Solana address_es_? So there's multiple?
    /** The solana addresses of the option account (PDA associated to the pools program)*/
    option: varchar("option", { length: 44 }).notNull(),

    // ASK_ANGAD: Solana address_es_? So there's multiple?
    /** The solana addresses of the pool account (PDA associated to the pools program)*/
    pool: varchar("pool", { length: 44 }).notNull(),

    // ASK_ANGAD: I was confused on whether to use `numeric` or `bigint`.
    // This (https://www.perplexity.ai/search/what-are-the-number-types-in-p-k8qPrqw3TtiaHxxaA2q8.Q#12 scroll down to Q12 ("Would a `numeric` or `decimal` be more appropriate than `BIGINT`?"))
    // is the reference for how I decided on bigint. Do you foresee any issues here?
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

export type EntriesEntity = typeof entriesTable.$inferSelect;
export type EntriesInsertEntity = typeof entriesTable.$inferInsert;
