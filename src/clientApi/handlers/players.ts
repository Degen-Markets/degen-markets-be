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
import { findUserById } from "../../utils/twitter";
import { tryItAsync } from "../../utils/tryIt";

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
  logger.info("Received request to fetch player by ID");

  const playerId = event.pathParameters?.id;
  if (!playerId) {
    logger.warn("Player ID is missing", {
      pathParameters: event.pathParameters,
    });
    return buildBadRequestError("Player ID is required");
  }
  logger.debug("Parsed playerId", { playerId });

  let player = await PlayersService.getPlayerByAddress(playerId);
  if (!player) {
    logger.warn("Player not found");
    return buildNotFoundError("Player not found");
  }
  logger.debug("Found player");

  if (!player.twitterId) {
    logger.info("Returning player (has no twitterId)");
    return buildOkResponse(player);
  }
  logger.debug("Player has twitterId. Fetching latest info");

  const latestTwitterInfo = await findUserById(player.twitterId);
  if (!latestTwitterInfo) {
    logger.warn("Failed to fetch latest Twitter info");
    logger.info("Returning player (using older twitter info)");
    return buildOkResponse(player);
  }
  logger.debug("Found latest Twitter info for player");

  // Sync the latest twitter info in our db
  const updateTrial = await tryItAsync(() =>
    PlayersService.updateTwitterProfile(playerId, {
      twitterUsername: latestTwitterInfo.twitterUsername,
      twitterPfpUrl: latestTwitterInfo.twitterPfpUrl || null,
      twitterId: latestTwitterInfo.twitterId,
    }),
  );

  if (!updateTrial.success) {
    logger.error("Failed to update player's twitter profile", {
      error: updateTrial.err,
    });
    logger.info("Returning player (failed to update twitter info)", {
      playerId,
    });
    return buildOkResponse(player);
  }
  const updatedPlayer = updateTrial.data;
  logger.debug("Updated player's twitter profile");

  logger.info("Returning updated player");
  return buildOkResponse(updatedPlayer);
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
