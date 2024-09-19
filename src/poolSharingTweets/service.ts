import { eq } from "drizzle-orm";
import { DrizzleDb } from "../clients/DrizzleClient";
import {
  poolSharingTweetsTable,
  PoolSharingTweetInsertEntity,
  PoolSharingTweetEntity,
} from "./schema";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({
  serviceName: "PoolSharingTweetsService",
});

class PoolSharingTweetsService {
  static async insertNew(
    db: DrizzleDb,
    tweetData: PoolSharingTweetInsertEntity,
  ): Promise<void> {
    logger.info("Inserting tweet into db", { tweetData });
    const result = await db
      .insert(poolSharingTweetsTable)
      .values(tweetData)
      .returning();
    logger.info("Inserted tweet into db", { tweet: result[0] });
  }

  static async findByTweetId(
    db: DrizzleDb,
    tweetId: string,
  ): Promise<PoolSharingTweetEntity | null> {
    logger.info("Finding tweet by id", { tweetId });
    const result = await db
      .select()
      .from(poolSharingTweetsTable)
      .where(eq(poolSharingTweetsTable.tweetId, tweetId));
    const tweet = result[0];
    if (!tweet) {
      logger.info("Tweet not found", { tweetId });
      return null;
    }

    logger.info("Found tweet by id", { tweet });
    return tweet;
  }
}

export default PoolSharingTweetsService;
