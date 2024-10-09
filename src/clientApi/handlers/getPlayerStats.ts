import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { buildOkResponse } from "../../utils/httpResponses";

const logger = new Logger({ serviceName: "getPlayerStats" });

export const getPlayerStatsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Received request for player stats", { event });

  // TODO: Implement the logic to fetch and return player stats

  // Placeholder response
  const placeholderStats = {
    message: "Player stats endpoint not yet implemented",
  };

  logger.info("Completed running `getPlayerStatsHandler`");
  return buildOkResponse(placeholderStats);
};
