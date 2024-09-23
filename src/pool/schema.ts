import { sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { poolOptionsTable } from "../poolOptions/schema";

export const poolsTable = pgTable(
  "pools",
  {
    address: varchar("address", { length: 44 }).primaryKey(),
    title: varchar("title", { length: 100 }).notNull(),
    description: varchar("description", { length: 200 }),
    image: varchar("image", { length: 100 }),
    isPaused: boolean("isPaused").notNull(), // Field can be true, false
    winningOption: varchar("winningOption", { length: 44 }).notNull(),
    value: numeric("value", {
      precision: 50, // biggest number in rust is u128, so 50 precision gives us plenty of space
      scale: 0, // 0 scale because we do not want any decimals
    }).notNull(),
    createdAt: timestamp("createdAt", { mode: "string" })
      .notNull()
      .default(sql`now()`), // Automatically sets the current timestamp on row insertion, eliminating the need to manually provide it.
  },
  (table) => {
    return {
      idxPoolsValue: index("idx_pools_value").on(table.value),
    };
  },
);
