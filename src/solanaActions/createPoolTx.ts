import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import { tryIt, tryItAsync } from "../utils/tryIt";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../utils/httpResponses";
import _Utils from "./utils/createPoolTx.utils";

const logger: Logger = new Logger({ serviceName: "generateCreatePoolTx" });

/**
 * Refer https://docs.dialect.to/documentation/actions/specification/get#get-response-body
 * for list of supported image extension types
 * > `icon` - Must be an absolute HTTP or HTTPS URL of an image describing the action. Supported
 * > image formats are SVG, PNG, or WebP image. If none of the above, the client must reject
 * > it as malformed.
 *
 * In practice we have seen that gif, jpeg and jpg images are also accepted
 */
const VALID_IMAGE_EXTENSIONS = [
  "svg",
  "png",
  "webp",
  "jpeg",
  "jpg",
  "gif",
] as const;

const generateCreatePoolTx = async (event: APIGatewayProxyEventV2) => {
  const poolTitle = event.queryStringParameters?.title;
  const imageUrl = event.queryStringParameters?.image;
  const description = event.queryStringParameters?.description || "";
  const { account } = JSON.parse(event.body || "{}");
  logger.info("Serializing a pool creation tx", {
    title: poolTitle,
    image: imageUrl,
    description,
    account,
  });

  if (!poolTitle) {
    logger.error("Pool title not found", { poolTitle });
    return buildBadRequestError(
      "Pool title missing in request",
      ACTIONS_CORS_HEADERS,
    );
  }

  const creatorTrial = tryIt(() => new PublicKey(account));
  if (!creatorTrial.success) {
    logger.error("Valid account is missing in request", { account });
    return buildBadRequestError(
      "Valid account is missing in request",
      ACTIONS_CORS_HEADERS,
    );
  }
  const creator = creatorTrial.data;

  const imgUrlTrial = await tryItAsync<string, Error>(async () =>
    _Utils.getFinalImgUrl(imageUrl, VALID_IMAGE_EXTENSIONS),
  );
  if (!imgUrlTrial.success) {
    logger.error("Error processing image", { error: imgUrlTrial.err });
    return buildBadRequestError(
      (imgUrlTrial.err as Error).message,
      ACTIONS_CORS_HEADERS,
    );
  }
  const imgUrl = imgUrlTrial.data;

  const payloadTrial = await tryItAsync(async () =>
    _Utils.serializeCreatePoolTx({
      poolTitle,
      imgUrl,
      description,
      creator,
    }),
  );

  if (!payloadTrial.success) {
    logger.error((payloadTrial.err as Error).message, {
      error: payloadTrial.err,
    });
    return buildInternalServerError(
      "Something went wrong, please try again",
      ACTIONS_CORS_HEADERS,
    );
  }

  const payload = payloadTrial.data;
  logger.info("Pool Creation transaction generated", { ...payload });
  return buildOkResponse(payload, ACTIONS_CORS_HEADERS);
};

export default generateCreatePoolTx;
