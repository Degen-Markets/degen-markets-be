import { sql } from "drizzle-orm";
import {
  PoolEntriesEntity,
  PoolEntriesInsertEntity,
  poolEntriesTable,
} from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";
import BN from "bn.js";
import { Client } from "pg";
import { DatabaseClient } from "../clients/DatabaseClient";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";

export default class PoolEntriesService {
  private static readonly logger = new Logger({
    serviceName: "PoolEntriesService",
  });
  static async makeDb(): Promise<{ db: NodePgDatabase; connection: Client }> {
    const dbClient = new DatabaseClient();
    const connection = await dbClient.createConnection();
    const db = drizzle(connection);
    return {
      db,
      connection,
    };
  }
  /**
   * Inserts a new pool entry or increments the value of an existing pool entry.
   * @param data - The data to insert or increment
   * @throws Will throw an error if the {@linkcode data['value']} is negative
   */
  static async insertNewOrIncrementValue(
    data: PoolEntriesInsertEntity,
  ): Promise<PoolEntriesEntity> {
    const { db, connection } = await this.makeDb();
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
    await connection.end();
    return poolEntry;
  }
}
