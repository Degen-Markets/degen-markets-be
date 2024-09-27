import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPoolPageUrlFromPoolId, parseTweetIdFromUrl } from "./utils";
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
import { PoolEntity } from "../../pools/schema";

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

  const { tweetUrl, poolId } = bodyParseTrial.data;
  if (typeof tweetUrl !== "string" || typeof poolId !== "string") {
    logger.error("Missing required fields in request body", {
      tweetUrl,
      poolId,
    });
    return buildBadRequestError("Missing required fields in request body");
  }
  logger.info("Parsed request body", { tweetUrl, poolId });

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

  let pool: PoolEntity | null;
  try {
    pool = await PoolsService.getPoolByAddress(poolId);
  } catch (e) {
    logger.error("Invalid pool ID", e as Error);
    return buildBadRequestError("Invalid pool ID");
  }

  if (!pool) {
    logger.error(`Pool with address ${poolId} not found}`);
    return buildBadRequestError("Invalid pool ID");
  }

  const tweetData = await findTweetById(tweetId);
  if (tweetData === null) {
    logger.error("Tweet not found", { tweetId });
    return buildBadRequestError("Tweet not found");
  }

  const player = await PlayersService.getPlayerByTwitterId(tweetData.authorId);
  if (!player) {
    logger.error("Player not found for Twitter ID", {
      twitterId: tweetData.authorId,
    });
    return buildBadRequestError("Player not found for the given tweet");
  }
  logger.info("Player found", { playerAddress: player.address });

  const tweetWithSameIdInDb =
    await PoolSharingTweetsService.findByTweetId(tweetId);
  if (tweetWithSameIdInDb !== null) {
    logger.error("Tweet already verified", { tweetId });
    return buildBadRequestError("Tweet already verified");
  }

  const poolPageUrl = getPoolPageUrlFromPoolId(poolId);
  if (!tweetData.content.includes(poolPageUrl)) {
    logger.error("Tweet content doesn't contain pool page URL", {
      poolPageUrl,
      tweetContent: tweetData.content,
    });
    return buildBadRequestError("Tweet content doesn't contain pool page URL");
  }
  logger.info("Tweet content contains pool page URL", {
    poolPageUrl,
    tweetId,
  });

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
