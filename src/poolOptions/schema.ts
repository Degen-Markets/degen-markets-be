import { index, numeric, pgTable, varchar, boolean } from "drizzle-orm/pg-core";
import { poolsTable } from "../pools/schema";

export const poolOptionsTable = pgTable(
  "pool_options",
  {
    address: varchar("address", { length: 44 }).primaryKey(), // Option ID
    pool: varchar("pool", { length: 44 })
      .notNull()
      .references(() => poolsTable.address), // Foreign key to poolsTable (each option belongs to a pool)
    title: varchar("title", { length: 100 }).notNull(), // Option title
    value: numeric("value", {
      precision: 50, // biggest number in rust is u128, so 50 precision gives us plenty of space
      scale: 0, // 0 scale because we do not want any decimals
    }).notNull(),
    isWinningOption: boolean("isWinningOption").notNull(), // field to indicate the winning option
  },
  (table) => {
    return {
      idxPoolOptionsPool: index("idx_poolOptions_pool").on(table.pool),
    };
  },
);
