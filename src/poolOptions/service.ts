import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { poolOptionsTable } from "./schema";
import { CreateOptionInput, PoolOptionEntity } from "./types";

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

  static incrementValue = async (
    optionAddress: string,
    value: string,
  ): Promise<PoolOptionEntity> => {
    this.logger.info(
      `Adding ${value} to Option with address: ${optionAddress}`,
    );
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db
        .update(poolOptionsTable)
        .set({ value: sql`${poolOptionsTable.value} + ${value}` })
        .where(eq(poolOptionsTable.address, optionAddress))
        .returning();

      const updatedOption = result[0];

      if (!updatedOption) {
        this.logger.error(
          `Option with address: ${optionAddress} failed to update`,
        );
        throw new Error("Pool Option update failed");
      }

      return updatedOption;
    });
  };

  static createNewOption = async (input: CreateOptionInput) => {
    this.logger.info(`Creating new Option: ${input.address}`);
    return this.databaseClient.withDb(async (db: NodePgDatabase) => {
      const result = await db
        .insert(poolOptionsTable)
        .values({
          ...input,
          value: "0",
          isWinningOption: false,
        })
        .returning();
      const option = result[0];
      if (!option) {
        this.logger.error(`Failed to insert Option ${input.address}`);
        throw new Error("Failed to insert Option");
      }
      this.logger.info(`Inserted option`, { option });
      return option;
    });
  };
}
