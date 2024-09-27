import { poolOptionsTable } from "./schema";

export type CreateOptionInput = {
  address: string;
  pool: string;
  title: string;
};
export type PoolOptionEntity = typeof poolOptionsTable.$inferSelect;
