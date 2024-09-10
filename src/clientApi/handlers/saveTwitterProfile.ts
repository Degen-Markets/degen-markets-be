import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { buildBadRequestError } from "../../utils/errors";
import { verifySignature } from "../../utils/cryptography";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PlayersService from "../../players/service";
import { buildOkResponse } from "../../utils/httpResponses";
import { findConnectedUser, requestAccessToken } from "../../utils/twitter";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "saveTwitterProfile" });

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
  const user = await PlayersService.insertNewOrSaveTwitterProfile(db, {
    address,
    twitterUsername: twitterUser?.username,
    twitterPfpUrl: twitterUser?.profile_image_url,
  });
  return buildOkResponse(user);
};

export default saveTwitterProfile;
