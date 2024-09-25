import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { PoolOptionEntity, poolOptionsTable } from "./schema";

export default class PoolOptionsService {
  private static readonly logger = new Logger({
    serviceName: "PoolOptionsService",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  static getAllInPool = async (
    poolAddress: string,
  ): Promise<PoolOptionEntity[]> => {
    this.logger.info(`Fetching options by pool: ${poolAddress}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) =>
      db
        .select()
        .from(poolOptionsTable)
        .where(sql`${poolOptionsTable.pool} = ${poolAddress}`),
    );
  };
}
