import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../players/service";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildNotFoundError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { asc, desc } from "drizzle-orm";
import { playersTable } from "../../players/schema";

const logger = new Logger({ serviceName: "playersHandlers" });

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

    const validLimit = Math.min(limit, 20);
    const orderByClause = createOrderByClause(direction);

    const players = await PlayersService.getPlayers(
      validLimit,
      offset,
      orderByClause,
    );

    logger.info("Successfully retrieved players", { players });

    return buildOkResponse(players);
  } catch (e) {
    logger.error("Error fetching players", { error: e });
    return buildInternalServerError("An unexpected error occurred");
  }
};

export const getPlayerByIdHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const playerId = event.pathParameters?.id;

  if (!playerId) {
    return buildBadRequestError("Player ID is required");
  }

  logger.info("Received request to fetch player by ID", { playerId });

  let player;

  try {
    player = await PlayersService.getPlayerByAddress(playerId);
  } catch (e) {
    logger.error("Error fetching player", { error: e });
    return buildInternalServerError("An unexpected error occurred");
  }

  if (!player) {
    logger.error("Player not found", { playerId });
    return buildNotFoundError("Player not found");
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
