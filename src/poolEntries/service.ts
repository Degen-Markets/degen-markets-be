import { sql } from "drizzle-orm";
import {
  PoolEntriesEntity,
  PoolEntriesInsertEntity,
  poolEntriesTable,
} from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";
import BN from "bn.js";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export default class PoolEntriesService {
  private static readonly logger = new Logger({
    serviceName: "PoolEntriesService",
  });
  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static async _insertNewOrIncrementValue(
    db: NodePgDatabase,
    data: PoolEntriesInsertEntity,
  ): Promise<PoolEntriesEntity> {
    if (new BN(data.value).ltn(0)) throw new Error("Value must be positive");
    this.logger.info("Inserting entry into db", { poolEntry: data });
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

    const poolEntry = result[0];
    this.logger.debug("Inserted or incremented pool entry value", {
      poolEntry,
    });
    return poolEntry;
  }

  /**
   * Inserts a new pool entry or increments the value of an existing pool entry.
   * @param data - The data to insert or increment
   * @throws Will throw an error if the {@linkcode data['value']} is negative
   */
  static insertNewOrIncrementValue = async (data: PoolEntriesInsertEntity) =>
    this.databaseClient.withDb(async (db) =>
      this._insertNewOrIncrementValue(db, data),
    );
}
