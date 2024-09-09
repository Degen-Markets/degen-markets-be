import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PlayersService from "../../players/service";
import { buildErrorResponse, buildOkResponse } from "../../utils/httpResponses";

const logger = new Logger({ serviceName: "clientApi" });

export const getPlayersHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const { limit, offset, sort } = extractQueryParams(event);

  logger.info("Received request to fetch players", { limit, offset, sort });

  try {
    const db = await DrizzleClient.makeDb();
    const players = await PlayersService.getPlayers(db, limit, offset, sort);

    logger.info("Successfully retrieved players", { count: players.length });

    return buildOkResponse(players);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Error fetching players", { errorMessage });

    return buildErrorResponse("An unexpected error occurred");
  }
};

const extractQueryParams = (event: APIGatewayProxyEventV2) => {
  const limit = parseInt(event.queryStringParameters?.limit || "10", 10);
  const offset = parseInt(event.queryStringParameters?.offset || "0", 10);
  const sort = event.queryStringParameters?.sort || "points:DESC";

  return { limit, offset, sort };
};
