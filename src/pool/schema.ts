// Define Pools Table
import { index, numeric, pgTable, varchar, boolean } from "drizzle-orm/pg-core";

export const poolsTable = pgTable(
  "pools",
  {
    address: varchar("address", { length: 44 }).primaryKey(),
    title: varchar("title", { length: 100 }).notNull(),
    description: varchar("description", { length: 200 }),
    image: varchar("image", { length: 100 }),
    isPaused: boolean("isPaused").notNull(), // Field can be true, false
    winningOption: varchar("winningOption", { length: 44 }).notNull(), // Foreign key to winning option
    value: numeric("value", {
      precision: 50, // biggest number in rust is u128, so 50 precision gives us plenty of space
      scale: 0, // 0 scale because we do not want any decimals
    }).notNull(),
  },
  (table) => {
    return {
      idxWinningOption: index("idx_winning_option").on(table.winningOption),
    };
  },
);
