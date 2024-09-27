import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseTweetIdFromUrl, extractPoolIdFromTweetContent } from "./utils";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { tryIt } from "../../utils/tryIt";
import { findTweetById } from "../../utils/twitter";
import PlayersService from "../../players/service";
import PoolSharingTweetsService from "../../poolSharingTweets/service";
import { Logger } from "@aws-lambda-powertools/logger";
import PoolsService from "../../pools/service";

const POINTS_AWARDED_FOR_SHARE = 10;

const logger = new Logger({
  serviceName: "claimPoolTweetPointsHandler",
});

const claimPoolTweetPointsHandler = async (event: APIGatewayProxyEventV2) => {
  logger.info("Running `claimPoolTweetPoints` handler", { event });

  const bodyParseTrial = tryIt(() => JSON.parse(event.body || "{}"));
  if (!bodyParseTrial.success) {
    logger.error("Failed to parse request body", {
      error: bodyParseTrial.err,
    });
    return buildBadRequestError("Couldn't parse request body");
  }

  const { tweetUrl } = bodyParseTrial.data;
  if (typeof tweetUrl !== "string") {
    logger.error("Missing required field in request body", { tweetUrl });
    return buildBadRequestError("Missing required field in request body");
  }
  logger.info("Parsed request body", { tweetUrl });

  const tweetIdParseTrial = tryIt(() => parseTweetIdFromUrl(tweetUrl));
  if (!tweetIdParseTrial.success) {
    logger.error("Failed to parse tweet ID from URL", {
      tweetUrl,
      error: tweetIdParseTrial.err,
    });
    return buildBadRequestError("Invalid tweet URL");
  }
  const tweetId = tweetIdParseTrial.data;
  logger.info("Parsed tweet ID", { tweetId });

  const tweetWithSameIdInDb =
    await PoolSharingTweetsService.findByTweetId(tweetId);
  if (tweetWithSameIdInDb !== null) {
    logger.error("Tweet already claimed", { tweetId });
    return buildBadRequestError("Tweet already claimed");
  }

  const tweetData = await findTweetById(tweetId);
  if (tweetData === null) {
    logger.error("Tweet not found", { tweetId });
    return buildBadRequestError("Tweet not found");
  }

  const poolIdExtractTrial = tryIt(() =>
    extractPoolIdFromTweetContent(tweetData.content),
  );
  if (!poolIdExtractTrial.success) {
    logger.error("Failed to extract pool ID from tweet content", {
      tweetContent: tweetData.content,
      error: poolIdExtractTrial.err,
    });
    return buildBadRequestError("Tweet content doesn't satisfy requirement");
  }
  const poolId = poolIdExtractTrial.data;
  logger.info("Extracted pool ID from tweet content", { poolId });

  const pool = await PoolsService.getPoolByAddress(poolId);
  if (!pool) {
    logger.error(`Pool with address ${poolId} not found`);
    return buildBadRequestError("Invalid pool ID in tweet");
  }

  const player = await PlayersService.getPlayerByTwitterId(tweetData.authorId);
  if (!player) {
    logger.error("Player not found for Twitter ID", {
      twitterId: tweetData.authorId,
    });
    return buildBadRequestError("Tweet author isn't a registered player");
  }
  logger.info("Player found", { playerAddress: player.address });

  await PlayersService.changePoints(player.address, POINTS_AWARDED_FOR_SHARE);
  logger.info("Awarded points to player", {
    playerAddress: player.address,
    points: POINTS_AWARDED_FOR_SHARE,
  });

  await PoolSharingTweetsService.insertNew({
    tweetId,
    pool: poolId,
    player: player.address,
  });
  logger.info("Inserted new pool sharing tweet record", {
    tweetId,
  });

  logger.info("Completed running `claimPoolTweetPoints` handler");
  return buildOkResponse({
    message: "Pool tweet points claimed successfully",
    pointsAwarded: POINTS_AWARDED_FOR_SHARE,
  });
};

export default claimPoolTweetPointsHandler;
