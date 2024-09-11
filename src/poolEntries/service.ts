import { sql } from "drizzle-orm";
import { DrizzleDb } from "../clients/DrizzleClient";
import { PoolEntriesInsertEntity, poolEntriesTable } from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";
import BN from "bn.js";

const logger = new Logger({
  serviceName: "PoolEntriesService",
});

export default class PoolEntriesService {
  /**
   * Inserts a new pool entry or increments the value of an existing pool entry.
   * @param db - The database connection
   * @param data - The data to insert or increment
   * @throws Will throw an error if the {@linkcode data['value']} is negative
   */
  static async insertNewOrIncrementValue(
    db: DrizzleDb,
    data: PoolEntriesInsertEntity,
  ) {
    if (new BN(data.value).ltn(0)) throw new Error("Value must be positive");
    logger.info("Inserting entry into db", { poolEntry: data });
    const { address, entrant, option, pool, value } = data;
    const result = await db
      .insert(poolEntriesTable)
      .values({ address, entrant, option, pool, value })
      .onConflictDoUpdate({
        target: poolEntriesTable.address,
        set: {
          value: sql`${poolEntriesTable.value} + ${value}`,
        },
      })
      .returning();

    logger.debug("Inserted or incremented pool entry value", {
      poolEntry: result[0],
    });
  }
}
