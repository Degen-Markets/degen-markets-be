import PoolsJson from "../../solanaActions/pools.json";
import { buildNotFoundError, buildOkResponse } from "../../utils/httpResponses";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export const getAllPools = () => {
  const pools = Object.entries(PoolsJson).map(([id, pool]) => ({
    id,
    ...pool,
  }));
  return buildOkResponse(pools);
};

export const getPoolById = (
  event: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 => {
  const id = event.pathParameters?.id as keyof typeof PoolsJson;
  const pool = PoolsJson[id];
  if (!pool) {
    return buildNotFoundError("Pool not found!");
  }
  return buildOkResponse(pool);
};
