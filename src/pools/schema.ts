import {
  boolean,
  index,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const poolsTable = pgTable(
  "pools",
  {
    address: varchar("address", { length: 44 }).primaryKey(),
    title: varchar("title", { length: 100 }).notNull(),
    description: varchar("description", { length: 200 }).notNull().default(""),
    image: varchar("image", { length: 200 }).notNull(),
    isPaused: boolean("isPaused").notNull(), // Field can be true, false
    value: numeric("value", {
      precision: 50, // biggest number in rust is u128, so 50 precision gives us plenty of space
      scale: 0, // 0 scale because we do not want any decimals
    }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(), // Automatically sets the current timestamp on row insertion, eliminating the need to manually provide it.
    token: varchar("token", { length: 44 }),
  },
  (table) => {
    return {
      idxPoolsValue: index("idx_pools_value").on(table.value),
    };
  },
);
