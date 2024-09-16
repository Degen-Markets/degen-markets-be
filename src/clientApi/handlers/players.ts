import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { DrizzleClient } from "../../clients/DrizzleClient";
import PlayersService from "../../players/service";
import { buildErrorResponse, buildOkResponse } from "../../utils/httpResponses";
import { asc, desc } from "drizzle-orm";
import { playersTable } from "../../players/schema";
import { buildBadRequestError } from "../../utils/errors";

const logger = new Logger({ serviceName: "clientApi" });

export const getPlayersHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const { limit, offset, sort } = extractQueryParams(event);

  logger.info("Received request to fetch players", { limit, offset, sort });

  try {
    const [field, direction] = sort.split(":");
    if (field !== "points") {
      logger.error("Invalid field provided for sorting", { field });
      return buildBadRequestError(`Invalid field: ${field}`);
    }

    if (direction !== "ASC" && direction !== "DESC") {
      logger.error("Invalid sort direction provided", { direction });
      return buildBadRequestError(`Invalid direction: ${direction}`);
    }

    const validLimit = Math.min(limit, 10);
    const orderByClause = createOrderByClause(direction);

    const db = await DrizzleClient.makeDb();
    const players = await PlayersService.getPlayers(
      db,
      validLimit,
      offset,
      orderByClause,
    );

    logger.info("Successfully retrieved players", { players });

    return buildOkResponse(players);
  } catch (e) {
    logger.error("Error fetching players", { error: e });
    return buildErrorResponse("An unexpected error occurred");
  }
};

export const getPlayerByIdHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const playerId = event.pathParameters?.id;

  if (!playerId) {
    return buildErrorResponse("Player ID is required", 400);
  }

  logger.info("Received request to fetch player by ID", { playerId });

  let player;

  try {
    const db = await DrizzleClient.makeDb();
    player = await PlayersService.getPlayerByAddress(db, playerId);
  } catch (e) {
    logger.error("Error fetching player", { error: e });
    return buildErrorResponse("An unexpected error occurred");
  }

  if (!player) {
    logger.error("Player not found", { playerId });
    return buildErrorResponse("Player not found", 404);
  }

  logger.info("Successfully retrieved player", { player });
  return buildOkResponse(player);
};

const extractQueryParams = (event: APIGatewayProxyEventV2) => {
  const limit = parseInt(event.queryStringParameters?.limit || "10", 10);
  const offset = parseInt(event.queryStringParameters?.offset || "0", 10);
  const sort = event.queryStringParameters?.sort || "points:DESC";

  return { limit, offset, sort };
};

export const createOrderByClause = (direction: string) => {
  return direction === "ASC"
    ? asc(playersTable.points)
    : desc(playersTable.points);
};
