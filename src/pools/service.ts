import { sql } from "drizzle-orm";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { poolOptionsTable } from "../poolOptions/schema";
import { poolsTable } from "./schema";

export default class PoolsService {
  private static readonly logger = new Logger({
    serviceName: "PoolsService",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static getAllPools = async () => {
    this.logger.info("Fetching all pools from database");
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const pools = await db.select().from(poolsTable);
      const poolOptions = await db.select().from(poolOptionsTable);

      const poolsWithOptions = pools.map((pool) => ({
        ...pool,
        options: poolOptions.filter((option) => option.pool === pool.address),
      }));

      return poolsWithOptions;
    });
  };

  static getPoolByAddress = async (poolAddress: string) => {
    this.logger.info(`Fetching pool by Address: ${poolAddress}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const pool = await db
        .select()
        .from(poolsTable)
        .where(sql`${poolsTable.address} = ${poolAddress}`);

      if (!pool.length) throw new Error("Pool not found");

      const options = await db
        .select()
        .from(poolOptionsTable)
        .where(sql`${poolOptionsTable.pool} = ${poolAddress}`);

      return {
        ...pool[0],
        options,
      };
    });
  };
}
