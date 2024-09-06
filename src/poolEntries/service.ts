import { sql } from "drizzle-orm";
import { DrizzleDb } from "../clients/DrizzleClient";
import { PoolEntriesInsertEntity, poolEntriesTable } from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({
  serviceName: "PoolEntriesService",
});

export default class PoolEntriesService {
  static async insertOrUpdate(db: DrizzleDb, data: PoolEntriesInsertEntity) {
    const { address, entrant, option, pool, value } = data;
    const result = await db
      .insert(poolEntriesTable)
      .values({ address, entrant, option, pool, value })
      .onConflictDoUpdate({
        target: poolEntriesTable.address,
        set: { value: sql`${poolEntriesTable.value} + ${value}` },
      })
      .returning();

    logger.debug("Upserted pool entry", { poolEntry: result[0] });
  }
}
