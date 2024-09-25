import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPoolPageUrlFromPoolId, parseTweetIdFromUrl } from "./utils";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { tryIt } from "../../utils/tryIt";
import { findTweetContentById } from "../../utils/twitter";
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

  const { tweetUrl, poolId, playerAddress } = bodyParseTrial.data;
  if (
    typeof tweetUrl !== "string" ||
    typeof poolId !== "string" ||
    typeof playerAddress !== "string"
  ) {
    logger.error("Missing required fields in request body", {
      tweetUrl,
      poolId,
      playerAddress,
    });
    return buildBadRequestError("Missing required fields in request body");
  }
  logger.info("Parsed request body", { tweetUrl, poolId, playerAddress });

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

  const player = await PlayersService.getPlayerByAddress(playerAddress);
  if (!player) {
    logger.error("Invalid player address", { playerAddress });
    return buildBadRequestError("Invalid player address");
  }
  logger.info("Player found", { playerAddress });

  const tweetWithSameIdInDb =
    await PoolSharingTweetsService.findByTweetId(tweetId);
  if (tweetWithSameIdInDb !== null) {
    logger.error("Tweet already verified", { tweetId });
    return buildBadRequestError("Tweet already verified");
  }

  const tweetContent = await findTweetContentById(tweetId);
  if (tweetContent === null) {
    logger.error("Tweet not found", { tweetId });
    return buildBadRequestError("Tweet not found");
  }

  const poolPageUrl = getPoolPageUrlFromPoolId(poolId);
  if (!tweetContent.includes(poolPageUrl)) {
    logger.error("Tweet content doesn't contain pool page URL", {
      poolPageUrl,
      tweetContent,
    });
    return buildBadRequestError("Tweet content doesn't contain pool page URL");
  }
  logger.info("Tweet content contains pool page URL", {
    poolPageUrl,
    tweetId,
  });

  await PlayersService.changePoints(playerAddress, POINTS_AWARDED_FOR_SHARE);
  logger.info("Awarded points to player", {
    playerAddress,
    points: POINTS_AWARDED_FOR_SHARE,
  });

  await PoolSharingTweetsService.insertNew({
    tweetId,
    pool: poolId,
    player: playerAddress,
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
