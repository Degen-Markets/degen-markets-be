import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { typedObjectKeys } from "../utils/typedStdLib";

const playersTableColumnsConfig = {
  address: varchar("address").primaryKey(),
  name: varchar("name", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  chain: varchar("chain", { length: 20 }).notNull().default("base"),
  points: integer("points").notNull().default(0),
};

export const playersTable = pgTable(
  "players",
  playersTableColumnsConfig,
  (table) => {
    return {
      idxPoints: index("idx_points").on(table.points),
    };
  },
);

export const playersTableColumnNames = typedObjectKeys(
  playersTableColumnsConfig,
);
