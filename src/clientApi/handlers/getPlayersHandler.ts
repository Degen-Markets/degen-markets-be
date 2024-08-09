import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import * as PlayerService from "../../players/PlayerService";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";
import { ESortDirections } from "../../utils/queryString";
import { typedIncludes, typedObjectKeys } from "../../utils/typedStdLib";
import { playersTableColumnNames } from "../../players/schema";

const MAX_PLAYERS_RETURNED_LIMIT = 10;
const ALLOWED_SORT_COLS = ["points"] satisfies typeof playersTableColumnNames;

const logger = new Logger({
  serviceName: "GetPlayersHandler",
});

const playersHandler = async ({
  queryStringParameters: qs,
}: APIGatewayEvent) => {
  logger.info(
    `fetching players with querystring params: ${JSON.stringify(qs)}`,
  );
  const playerListParams: Parameters<typeof PlayerService.findAllPlayers>[0] = {
    limit: MAX_PLAYERS_RETURNED_LIMIT,
    orderBy: { points: ESortDirections.DESC },
  };
  if (qs) {
    if (qs.limit) {
      const limit = Number(qs.limit);
      if (isNaN(limit)) {
        logger.error(`Invalid limit parameter(${qs.limit})`);
        return buildBadRequestError(`Invalid limit parameter(${qs.limit})`);
      }

      playerListParams.limit =
        limit < MAX_PLAYERS_RETURNED_LIMIT ? limit : MAX_PLAYERS_RETURNED_LIMIT;
    }
    if (qs.offset) {
      const offset = Number(qs.offset);
      if (isNaN(offset)) {
        logger.error(`Invalid offset parameter(${qs.offset})`);
        return buildBadRequestError(`Invalid offset parameter(${qs.offset})`);
      }

      playerListParams.offset = offset;
    }
    if (qs.sort) {
      const [sortByField = "", sortDir = ESortDirections.DESC] =
        qs.sort.split(":");
      if (
        typedIncludes(ALLOWED_SORT_COLS, sortByField) &&
        typedIncludes(typedObjectKeys(ESortDirections), sortDir)
      ) {
        playerListParams.orderBy = {
          [sortByField]:
            sortDir === "ASC" ? ESortDirections.ASC : ESortDirections.DESC,
        };
      } else {
        logger.error(`Invalid sort parameter(${qs.sort})`);
        return buildBadRequestError(`Invalid sort parameter(${qs.sort})`);
      }
    }
  }

  const playersList = await PlayerService.findAllPlayers(playerListParams);
  logger.info(`Successfully fetched players for qs=${JSON.stringify(qs)}`);
  return buildOkResponse(playersList);
};

export default playersHandler;
