import { sql } from "drizzle-orm";
import { DrizzleDb } from "../clients/DrizzleClient";
import { poolEntriesTable } from "./schema";

export async function insertOrUpdatePoolEntry(
  db: DrizzleDb,
  address: string,
  entrant: string,
  option: string,
  pool: string,
  value: bigint,
) {
  await db
    .insert(poolEntriesTable)
    .values({ address, entrant, option, pool, value })
    .onConflictDoUpdate({
      target: poolEntriesTable.address,
      set: { value: sql`${poolEntriesTable.value} + ${value}` },
    });
}
