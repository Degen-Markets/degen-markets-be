import { Logger } from "@aws-lambda-powertools/logger";
import PoolsService from "../../pools/service";
import {
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { PoolEntity } from "../../pools/types";

const logger = new Logger({ serviceName: "poolsHandlers" });

export const getAllPools = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const {
    status = "",
    sortBy = "newest",
    applyPausedFallback = "false",
    limit = "18",
    offset = "0",
  } = event.queryStringParameters || {};

  const parsedLimit =
    isNaN(parseInt(limit)) || parseInt(limit) <= 0 ? 18 : parseInt(limit);
  const parsedOffset =
    isNaN(parseInt(offset)) || parseInt(offset) < 0 ? 0 : parseInt(offset);

  let pools;
  try {
    pools = await PoolsService.getAllPools(
      status,
      sortBy,
      applyPausedFallback === "true",
      parsedLimit,
      parsedOffset,
    );
  } catch (error) {
    logger.error("Error fetching pools", { error });
    return buildInternalServerError("An unexpected error occurred");
  }

  logger.info("Successfully retrieved pools", { pools });
  return buildOkResponse(pools);
};

export const getPoolByAddress = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const address = event.pathParameters?.address;
  if (!address) {
    logger.error("Pool Address not found", { address });
    return buildNotFoundError("Pool ID not provided");
  }
  logger.info("Received request to fetch Pool by Address", { address });
  let pool: PoolEntity | null;
  try {
    pool = await PoolsService.getPoolByAddress(address);
  } catch (error) {
    logger.error("Error fetching pool", { error: error });
    return buildInternalServerError("An unexpected error occurred");
  }
  if (!pool) {
    logger.error("Pool not found", { address });
    return buildNotFoundError("Pool not found");
  }
  logger.info("successfully retrieved pool");
  return buildOkResponse(pool);
};
