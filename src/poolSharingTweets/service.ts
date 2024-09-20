import { eq } from "drizzle-orm";
import {
  poolSharingTweetsTable,
  PoolSharingTweetInsertEntity,
  PoolSharingTweetEntity,
} from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

class PoolSharingTweetsService {
  private static readonly logger = new Logger({
    serviceName: "PoolSharingTweetsService",
  });

  private static readonly databaseClient: DatabaseClient = new DatabaseClient();

  private static async _insertNew(
    db: NodePgDatabase,
    tweetData: PoolSharingTweetInsertEntity,
  ): Promise<void> {
    this.logger.info("Inserting tweet into db", { tweetData });
    const result = await db
      .insert(poolSharingTweetsTable)
      .values(tweetData)
      .returning();
    this.logger.info("Inserted tweet into db", { tweet: result[0] });
  }

  static insertNew = async (
    tweetData: PoolSharingTweetInsertEntity,
  ): Promise<void> =>
    this.databaseClient.withDb(async (db) => this._insertNew(db, tweetData));

  private static async _findByTweetId(
    db: NodePgDatabase,
    tweetId: string,
  ): Promise<PoolSharingTweetEntity | null> {
    this.logger.info("Finding tweet by id", { tweetId });
    const result = await db
      .select()
      .from(poolSharingTweetsTable)
      .where(eq(poolSharingTweetsTable.tweetId, tweetId));
    const tweet = result[0];
    if (!tweet) {
      this.logger.info("Tweet not found", { tweetId });
      return null;
    }

    this.logger.info("Found tweet by id", { tweet });
    return tweet;
  }

  static findByTweetId = async (
    tweetId: string,
  ): Promise<PoolSharingTweetEntity | null> =>
    this.databaseClient.withDb(async (db) => this._findByTweetId(db, tweetId));
}

export default PoolSharingTweetsService;
