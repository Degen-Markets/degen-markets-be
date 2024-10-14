import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../utils/httpResponses";
import { verifySignature } from "../../utils/cryptography";
import { Logger } from "@aws-lambda-powertools/logger";
import PoolsService from "../../pools/service";
import { tryIt } from "../../utils/tryIt";
import { ADMIN_PUBKEY } from "../constants";

const logger = new Logger({ serviceName: "deletePoolHandler" });

const deletePoolHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Starting processing", { event });

  const bodyParseTrial = tryIt(() => JSON.parse(event.body || "{}"));
  if (!bodyParseTrial.success) {
    logger.error("Failed to parse request body", {
      error: bodyParseTrial.err,
    });
    return buildBadRequestError("Couldn't parse request body");
  }

  const { poolAddress, signature } = bodyParseTrial.data;
  if (typeof poolAddress !== "string" || typeof signature !== "string") {
    logger.error("Missing required fields in request body", {
      poolAddress,
      signature,
    });
    return buildBadRequestError("Missing required fields in request body");
  }
  logger.info("Parsed request body", { poolAddress, signature });

  const verified = verifySignature(signature, ADMIN_PUBKEY);
  if (!verified) {
    logger.error("Unauthorized: Admin access required", { signature });
    return buildUnauthorizedError("Unauthorized: Admin access required");
  }

  // To reduce number of DB calls in happy path, we don't check if the pool exists before issuing delete.
  // Rather, the result of delete tells us if the request was bad
  logger.info(`Attempting to delete pool with address: ${poolAddress}`);
  const deletedPool = await PoolsService.deletePool(poolAddress);
  if (!deletedPool) {
    logger.error(`Pool with address ${poolAddress} not found`);
    return buildNotFoundError(`Pool with address ${poolAddress} not found`);
  }

  logger.info(`Successfully deleted pool with address: ${poolAddress}`);
  return buildOkResponse(
    `Successfully deleted pool with address: ${poolAddress}`,
  );
};

export default deletePoolHandler;
