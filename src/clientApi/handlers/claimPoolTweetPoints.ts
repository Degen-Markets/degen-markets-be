import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseTweetIdFromUrl, getPoolPageUrlFromPoolId } from "./utils";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { tryIt } from "../../utils/tryIt";
import { findTweetContentById } from "../../utils/twitter";
import PlayersService from "../../players/service";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PoolsJson from "../../solanaActions/pools.json";
import PoolSharingTweetsService from "../../poolSharingTweets/service";
import { Logger } from "@aws-lambda-powertools/logger";

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

  if (!PoolsJson.hasOwnProperty(poolId)) {
    logger.error("Invalid pool ID", { poolId });
    return buildBadRequestError("Invalid pool ID");
  }

  const db = await DrizzleClient.makeDb();
  logger.info("Database connection established");

  const player = await PlayersService.getPlayerByAddress(db, playerAddress);
  if (!player) {
    logger.error("Invalid player address", { playerAddress });
    return buildBadRequestError("Invalid player address");
  }
  logger.info("Player found", { playerAddress });

  const tweetWithSameIdInDb = await PoolSharingTweetsService.findByTweetId(
    db,
    tweetId,
  );
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
  const isSuccess = tweetContent.includes(poolPageUrl);

  if (!isSuccess) {
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

  await PlayersService.changePoints(
    db,
    playerAddress,
    POINTS_AWARDED_FOR_SHARE,
  );
  logger.info("Awarded points to player", {
    playerAddress,
    points: POINTS_AWARDED_FOR_SHARE,
  });

  await PoolSharingTweetsService.insertNew(db, {
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
