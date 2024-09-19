import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { verifySignature } from "../../utils/cryptography";
import PlayersService from "../../players/service";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { findConnectedUser, requestAccessToken } from "../../utils/twitter";
import { Logger } from "@aws-lambda-powertools/logger";
import { findHighResImageUrl } from "./utils";
import { PlayerEntity } from "../../players/types";

const logger = new Logger({ serviceName: "saveTwitterProfile" });

const POINTS_AWARDED_FOR_LINKING_TWITTER = 10;

/**
 * This method should return the {@linkcode PlayerEntity} in the HTTP response for happy path
 */
const saveTwitterProfile = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Running `saveTwitterProfile` handler", { event });
  const body = JSON.parse(event.body || "{}");
  const {
    twitterCode,
    signature,
    address,
  }: { twitterCode: string; signature: string; address: string } = body;
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
    return buildBadRequestError("Invalid twitter user");
  }
  logger.info("Found user's twitter profile", { twitterUser });

  // add to db
  const playerByTwitterId = await PlayersService.getPlayerByTwitterId(
    twitterUser.id,
  );
  if (playerByTwitterId) {
    logger.info("Player already exists with this twitter id", {
      player: playerByTwitterId,
    });
    return buildBadRequestError(
      "This user is already signed up with a different wallet!",
    );
  }

  const twitterProfile = {
    twitterUsername: twitterUser.username,
    twitterPfpUrl: twitterUser.profile_image_url
      ? findHighResImageUrl(twitterUser.profile_image_url)
      : null,
    twitterId: twitterUser.id,
  };
  const playerByAddress = await PlayersService.getPlayerByAddress(address);
  let updatedPlayer: PlayerEntity;
  if (!playerByAddress) {
    logger.info("Player doesn't exist, creating new player");
    updatedPlayer = await PlayersService.insertNew({
      address,
      points: POINTS_AWARDED_FOR_LINKING_TWITTER,
      ...twitterProfile,
    });
  } else {
    const isTwitterAlreadyAdded = !!playerByAddress.twitterUsername;
    if (!isTwitterAlreadyAdded) {
      updatedPlayer = await PlayersService.changePoints(
        address,
        POINTS_AWARDED_FOR_LINKING_TWITTER,
      );
    }
    updatedPlayer = await PlayersService.updateTwitterProfile(
      address,
      twitterProfile,
    );
  }

  return buildOkResponse(updatedPlayer satisfies PlayerEntity);
};

export default saveTwitterProfile;
