import { desc, eq, sql } from "drizzle-orm";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { poolsTable } from "./schema";
import { CreatePoolInput, PoolEntity } from "./types";
import { poolOptionsTable } from "../poolOptions/schema";
import { poolSharingTweetsTable } from "../poolSharingTweets/schema";

export default class PoolsService {
  private static readonly logger = new Logger({
    serviceName: "PoolsService",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static getAllPools = async () =>
    this.databaseClient.withDb(async (db: NodePgDatabase) => {
      this.logger.info("Fetching all pools from database");
      const pools = await db
        .select()
        .from(poolsTable)
        .orderBy(desc(poolsTable.createdAt));
      this.logger.info(`Found ${pools.length} pools`);
      return pools;
    });

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

  static setIsPausedPool = async (isPaused: boolean, poolAddress: string) => {
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

  static deletePool = async (
    poolAddress: string,
  ): Promise<PoolEntity | null> => {
    this.logger.info(`Deleting pool with address: ${poolAddress}`);
    return this.databaseClient.withDb(async (db) => {
      return db.transaction(async (tx) => {
        // Delete foreign key references first
        const deletedSharingTweets = await tx
          .delete(poolSharingTweetsTable)
          .where(eq(poolSharingTweetsTable.pool, poolAddress))
          .returning();
        this.logger.info(`Deleted pool sharing tweets`, {
          deletedSharingTweets,
        });

        const deletedOptions = await tx
          .delete(poolOptionsTable)
          .where(eq(poolOptionsTable.pool, poolAddress))
          .returning();
        this.logger.info(`Deleted pool options`, { deletedOptions });

        // Delete the pool itself
        const deletedPools = await tx
          .delete(poolsTable)
          .where(eq(poolsTable.address, poolAddress))
          .returning();

        const [deletedPool = null, ...extraDeletedPools] = deletedPools;
        if (extraDeletedPools.length > 0) {
          // This will never run, as long as pool address is a unique key on poolsTable
          // Just making sure there's no regression in other parts of codebase
          this.logger.error(
            `Multiple pools with address ${poolAddress} deleted`,
            { deletedPools },
          );
          throw new Error("Multiple pools deleted");
        }

        this.logger.info(
          `Executed deletion of pool with address: ${poolAddress}`,
          { deletedPool },
        );
        return deletedPool;
      });
    });
  };
}
