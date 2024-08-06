import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const chainEnum = pgEnum("chain", ["base"]);

export const playersTable = pgTable(
  "players",
  {
    address: varchar("address").primaryKey(),
    name: varchar("name", { length: 20 }),
    avatarUrl: text('"avatarUrl"'),
    chain: chainEnum("chain").notNull().default("base"),
    points: integer("points").notNull().default(0),
  },
  (table) => {
    return {
      idxPoints: index("idx_points").on(table.points),
    };
  },
);

export type PlayerEntity = typeof playersTable.$inferSelect;
export type PlayerInsertEntity = typeof playersTable.$inferInsert;
