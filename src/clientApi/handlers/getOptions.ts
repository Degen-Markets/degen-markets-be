import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import PoolsService from "../../pools/service";
import PoolOptionsService from "../../poolOptions/service";
import {
  buildNotFoundError,
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";

const logger = new Logger({ serviceName: "getOptions" });

const getOptionsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Received request", { event });

  const poolAddress = event.queryStringParameters?.pool;
  if (!poolAddress) {
    logger.error("Missing required query parameter", { poolAddress });
    return buildBadRequestError("Pool address is required");
  }

  logger.info("Fetching options for pool", { poolAddress });

  const pool = await PoolsService.getPoolByAddress(poolAddress);
  if (!pool) {
    logger.error("Pool not found", { poolAddress });
    return buildNotFoundError(`Pool with address ${poolAddress} not found`);
  }

  const options = await PoolOptionsService.getAllInPool(poolAddress);
  logger.info("Fetched options for pool", {
    poolAddress,
    optionsCount: options.length,
  });

  logger.info("Completed running `getOptionsHandler`");
  return buildOkResponse(options);
};

export default getOptionsHandler;
