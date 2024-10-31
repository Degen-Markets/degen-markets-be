import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
} from "../../utils/httpResponses";
import PlayersService from "../../players/service";
import { typedIncludes } from "../../utils/typedStdLib";

const logger = new Logger({ serviceName: "getPlayerStats" });

const SORTABLE_FIELDS = ["createdAt"] as const;

type SortDirection = "ASC" | "DESC";

const getPlayerStatsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Received request for player stats", { event });

  const playerAddress = event.pathParameters?.id;
  if (!playerAddress) {
    return buildBadRequestError(":id URL path parameter is required");
  }

  // Parse and validate sort parameter
  const sortParam = event.queryStringParameters?.sort;
  let sort:
    | { field: (typeof SORTABLE_FIELDS)[number]; direction: SortDirection }
    | undefined;

  if (sortParam) {
    const [field, direction] = sortParam.split(":");

    if (!typedIncludes(SORTABLE_FIELDS, field)) {
      return buildBadRequestError(
        `Sort field must be one of: ${SORTABLE_FIELDS.join(", ")}`,
      );
    }

    if (direction !== "ASC" && direction !== "DESC") {
      return buildBadRequestError(
        "Sort direction must be either 'ASC' or 'DESC'",
      );
    }

    sort = { field, direction };
  }

  const player = await PlayersService.getPlayerByAddress(playerAddress);
  if (!player) {
    logger.error("Player not found", { playerAddress });
    return buildNotFoundError("Player not found");
  }

  logger.info("Player found, fetching stats", { playerAddress, sort });

  const playerStats = await PlayersService.getStats(playerAddress, { sort });

  logger.info("Successfully retrieved player stats", { playerStats });
  return buildOkResponse(playerStats);
};

export default getPlayerStatsHandler;
