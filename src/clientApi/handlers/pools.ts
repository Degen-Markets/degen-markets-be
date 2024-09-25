import { Logger } from "@aws-lambda-powertools/logger";
import PoolsService from "../../pools/service";
import {
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const logger = new Logger({ serviceName: "clientApi" });

export const getAllPools = async (): Promise<APIGatewayProxyResultV2> => {
  let pools;
  try {
    pools = await PoolsService.getAllPools();
  } catch (error) {
    logger.error("Error fetching pools", { error: error });
    return buildInternalServerError("An unexpected error occurred");
  }
  if (!pools || pools.length === 0) {
    logger.error("No pools found");
    return buildNotFoundError("No pools found");
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
  let pool;
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
