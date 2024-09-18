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
}

export default PoolSharingTweetsService;
