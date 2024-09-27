import { poolsTable } from "./schema";

export type CreatePoolInput = {
  address: string;
  title: string;
  description: string;
  image: string;
};

export type PoolEntity = typeof poolsTable.$inferSelect;
