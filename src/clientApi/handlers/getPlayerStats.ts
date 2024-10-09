import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
} from "../../utils/httpResponses";
import PlayersService from "../../players/service";

const logger = new Logger({ serviceName: "getPlayerStats" });

export const getPlayerStatsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Received request for player stats", { event });

  const playerAddress = event.pathParameters?.id;
  if (!playerAddress) {
    return buildBadRequestError("ID URL path parameter is required");
  }

  const player = await PlayersService.getPlayerByAddress(playerAddress);
  if (!player) {
    logger.error("Player not found", { playerAddress });
    return buildNotFoundError("Player not found");
  }

  logger.info("Player found, fetching stats", { playerAddress });

  const playerStats = await PlayersService.getStats(playerAddress);

  logger.info("Successfully retrieved player stats", { playerStats });
  return buildOkResponse(playerStats);
};
