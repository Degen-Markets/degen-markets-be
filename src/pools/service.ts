import { eq, sql } from "drizzle-orm";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { poolsTable } from "./schema";
import { CreatePoolInput, PoolEntity } from "./types";

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
      const result = await db
        .update(poolsTable)
        .set({ value: sql`${poolsTable.value} + ${value}` })
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

  static createNewPool = async (input: CreatePoolInput) => {
    this.logger.info(`Creating new Pool: ${input.address}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db
        .insert(poolsTable)
        .values({
          ...input,
          value: "0",
          isPaused: false,
        })
        .returning();
      const pool = result[0];
      if (!pool) {
        this.logger.error(`Failed to insert Pool ${input.address}`);
        throw new Error("Failed to insert Pool");
      }
      this.logger.info(`Inserted Pool`, { pool });
      return pool;
    });
  };

  static pausePool = async (isPaused: boolean, poolAddress: string) => {
    this.logger.info(`Pausing Pool ${poolAddress}: ${isPaused}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db
        .update(poolsTable)
        .set({ isPaused })
        .where(eq(poolsTable.address, poolAddress))
        .returning();

      const poolResult = result[0];
      if (!poolResult) {
        this.logger.error(`Failed to pause Pool ${poolAddress}`);
        throw new Error("Failed to pause Pool");
      }
      this.logger.info(`Paused pool ${poolAddress}`);

      return poolResult;
    });
  };
}
