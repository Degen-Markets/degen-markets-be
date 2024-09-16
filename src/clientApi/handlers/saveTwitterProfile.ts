import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { buildBadRequestError } from "../../utils/errors";
import { verifySignature } from "../../utils/cryptography";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PlayersService from "../../players/service";
import { buildErrorResponse, buildOkResponse } from "../../utils/httpResponses";
import { findConnectedUser, requestAccessToken } from "../../utils/twitter";
import { Logger } from "@aws-lambda-powertools/logger";
import { findHighResImageUrl } from "./utils";

const logger = new Logger({ serviceName: "saveTwitterProfile" });

const POINTS_AWARDED_FOR_LINKING_TWITTER = 10;

type SuccessPayload = {
  twitterUsername?: string;
  twitterPfpUrl?: string;
};

/**
 * This method should return the {@linkcode SuccessPayload} in the HTTP response for happy path
 */
const saveTwitterProfile = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Running `saveTwitterProfile` handler", { event });
  const body = JSON.parse(event.body || "{}");
  const { twitterCode, signature, address } = body;
  if (!twitterCode || !signature || !address) {
    return buildBadRequestError("Missing properties in request body");
  }

  const isCorrectAddress = verifySignature(signature, address);
  if (!isCorrectAddress) {
    return buildBadRequestError("This is not your address!");
  }
  logger.info(`Signature verification passed`);

  await requestAccessToken(twitterCode);
  const { data: twitterUser } = await findConnectedUser();
  if (!twitterUser) {
    logger.error("Couldn't find twitter user from code", { twitterCode });
    return buildErrorResponse("Invalid twitter user");
  }
  logger.info("Found user's twitter profile", { twitterUser });

  // add to db
  const db = await DrizzleClient.makeDb();
  const playerByTwitterId = await PlayersService.getPlayerByTwitterId(
    db,
    twitterUser.id,
  );
  if (playerByTwitterId) {
    logger.info("Player already exists with this twitter id", {
      player: playerByTwitterId,
    });
    return buildErrorResponse(
      "This user is already signed up with a different wallet!",
    );
  }

  const twitterProfile = {
    twitterUsername: twitterUser.username,
    twitterPfpUrl: twitterUser.profile_image_url
      ? findHighResImageUrl(twitterUser.profile_image_url)
      : undefined,
    twitterId: twitterUser.id,
  };
  const playerByAddress = await PlayersService.getPlayerByAddress(db, address);
  if (!playerByAddress) {
    logger.info("Player doesn't exist, creating new player");
    await PlayersService.insertNew(db, {
      address,
      points: POINTS_AWARDED_FOR_LINKING_TWITTER,
      ...twitterProfile,
    });
  } else {
    const isTwitterAlreadyAdded = !!playerByAddress.twitterUsername;
    if (!isTwitterAlreadyAdded) {
      await PlayersService.changePoints(
        db,
        address,
        POINTS_AWARDED_FOR_LINKING_TWITTER,
      );
    }
    await PlayersService.updateTwitterProfile(db, address, twitterProfile);
  }

  return buildOkResponse(twitterProfile satisfies SuccessPayload);
};

export default saveTwitterProfile;
