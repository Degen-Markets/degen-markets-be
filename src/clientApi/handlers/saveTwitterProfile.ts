import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { buildBadRequestError } from "../../utils/errors";
import { verifySignature } from "../../utils/cryptography";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PlayersService from "../../players/service";
import { buildOkResponse } from "../../utils/httpResponses";
import { findConnectedUser, requestAccessToken } from "../../utils/twitter";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "saveTwitterProfile" });

const lowResImageSuffix = "_normal";

const findHighResImageUrl = (twitterImageUrl: string | undefined) => {
  if (!twitterImageUrl) return undefined;
  return twitterImageUrl.split(lowResImageSuffix).join("");
};

const saveTwitterProfile = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
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
  logger.info("Found user's twitter profile", { twitterUser });
  const db = await DrizzleClient.makeDb();
  try {
    const user = await PlayersService.insertNewOrSaveTwitterProfile(db, {
      address,
      twitterUsername: twitterUser?.username,
      twitterPfpUrl: findHighResImageUrl(twitterUser?.profile_image_url),
      twitterId: twitterUser?.id,
    });
    return buildOkResponse(user);
  } catch (e) {
    const error = e as Error;
    logger.error(error.message);
    if (
      error.message.includes(
        'duplicate key value violates unique constraint "players_twitterId_unique"',
      )
    ) {
      return buildBadRequestError(
        "This user is already signed up with a different wallet!",
      );
    }
    return buildBadRequestError(
      "Failed to save your X/Twitter profile. Please contact the team through https://x.com/DEGEN_MARKETS.",
    );
  }
};

export default saveTwitterProfile;
