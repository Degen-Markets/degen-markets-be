import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import * as PlayerService from "../../players/PlayerService";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";
import {
  ESortDirections,
  getIsValidSortDirection,
} from "../../utils/queryString";

const logger = new Logger({
  serviceName: "GetPlayersHandler",
});

const playersHandler = async ({
  queryStringParameters: qs,
}: APIGatewayEvent) => {
  logger.info(
    `fetching players with querystring params: ${JSON.stringify(qs)}`,
  );
  const playerListParams: Parameters<typeof PlayerService.findAllPlayers>[0] =
    {};
  if (qs) {
    if (qs.limit) {
      const limit = Number(qs.limit);
      if (isNaN(limit)) {
        logger.error(`Invalid limit parameter(${qs.limit})`);
        return buildBadRequestError(`Invalid limit parameter(${qs.limit})`);
      }

      playerListParams.limit = limit;
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
        PlayerService.getIsValidFieldName(sortByField) &&
        getIsValidSortDirection(sortDir)
      ) {
        playerListParams.orderBy = { [sortByField]: sortDir };
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
