import { eq, sql } from "drizzle-orm";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PoolEntity, poolsTable } from "./schema";

export default class PoolsService {
  private static readonly logger = new Logger({
    serviceName: "PoolsService",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static getAllPools = async () => {
    this.logger.info("Fetching all pools from database");
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const pools = await db.select().from(poolsTable);
      return pools;
    });
  };

  static getPoolByAddress = async (
    poolAddress: string,
  ): Promise<PoolEntity | null> => {
    this.logger.info(`Fetching pool by Address: ${poolAddress}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db
        .select()
        .from(poolsTable)
        .where(sql`${poolsTable.address} = ${poolAddress}`);

      return result[0] || null;
    });
  };

  static incrementValue = async (
    poolAddress: string,
    value: string,
  ): Promise<PoolEntity> => {
    this.logger.info(`Incrementing value of option: ${poolAddress}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const pools = await db
        .select()
        .from(poolsTable)
        .where(eq(poolsTable.address, poolAddress))
        .limit(1);
      const pool = pools[0];
      if (!pool) {
        this.logger.error(`Pool with address: ${poolAddress} not found`);
        throw new Error("Pool not found");
      }

      const result = await db
        .update(poolsTable)
        .set({ value: sql`${pool.value} + ${value}` })
        .where(eq(poolsTable.address, poolAddress))
        .returning();

      const updatedPool = result[0];

      if (!updatedPool) {
        this.logger.error(`Pool with address: ${poolAddress} failed to update`);
        throw new Error("Pool Update failed");
      }

      return updatedPool;
    });
  };
}
