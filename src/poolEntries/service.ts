import { sql } from "drizzle-orm";
import { DrizzleDb } from "../clients/DrizzleClient";
import { PoolEntriesInsertEntity, poolEntriesTable } from "./schema";

namespace PoolEntriesService {
  export async function insertOrUpdate(
    db: DrizzleDb,
    data: PoolEntriesInsertEntity,
  ) {
    const { address, entrant, option, pool, value } = data;
    await db
      .insert(poolEntriesTable)
      .values({ address, entrant, option, pool, value })
      .onConflictDoUpdate({
        target: poolEntriesTable.address,
        set: { value: sql`${poolEntriesTable.value} + ${value}` },
      });
  }
}

export default PoolEntriesService;
