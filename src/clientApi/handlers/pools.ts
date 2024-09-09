import PoolsJson from "../../solanaActions/pools.json";
import { buildOkResponse } from "../../utils/httpResponses";
import { APIGatewayEvent } from "aws-lambda";
import { buildBadRequestError } from "../../utils/errors";

export const getAllPools = () => {
  const pools = Object.entries(PoolsJson).map(([id, pool]) => ({
    id,
    ...pool,
  }));
  return buildOkResponse(pools);
};

export const getPoolById = (event: APIGatewayEvent) => {
  const id = event.pathParameters?.id as keyof typeof PoolsJson;
  const pool = PoolsJson[id];
  if (!pool) {
    return buildBadRequestError("Pool not found!");
  }
  return buildOkResponse(pool);
};
