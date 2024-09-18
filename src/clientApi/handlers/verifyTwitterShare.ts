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

const POINTS_AWARDED_FOR_TWITTER_SHARE = 10;

const verifyTwitterShareHandler = async (event: APIGatewayProxyEventV2) => {
  const bodyParseTrial = tryIt(() => JSON.parse(event.body || "{}"));
  if (!bodyParseTrial.success) {
    return buildBadRequestError("Couldn't parse request body");
  }

  const { tweetUrl, poolId, playerAddress } = bodyParseTrial.data;
  if (
    typeof tweetUrl !== "string" ||
    typeof poolId !== "string" ||
    typeof playerAddress !== "string"
  ) {
    return buildBadRequestError("Missing required fields in request body");
  }

  const tweetIdParseTrial = tryIt(() => parseTweetIdFromUrl(tweetUrl));
  if (!tweetIdParseTrial.success) {
    return buildBadRequestError("Invalid tweet URL");
  }
  const tweetId = tweetIdParseTrial.data;

  if (!PoolsJson.hasOwnProperty(poolId)) {
    return buildBadRequestError("Invalid pool ID");
  }

  const db = await DrizzleClient.makeDb();

  const player = await PlayersService.getPlayerByAddress(db, playerAddress);
  if (!player) {
    return buildBadRequestError("Invalid player address");
  }

  const tweetContent = await findTweetContentById(tweetId);
  if (tweetContent === null) {
    return buildBadRequestError("Tweet not found");
  }

  const poolPageUrl = getPoolPageUrlFromPoolId(poolId);
  const isSuccess = tweetContent.includes(poolPageUrl);

  if (isSuccess) {
    await PlayersService.changePoints(
      db,
      playerAddress,
      POINTS_AWARDED_FOR_TWITTER_SHARE,
    );
  }

  return buildOkResponse({ isSuccess });
};

export default verifyTwitterShareHandler;
