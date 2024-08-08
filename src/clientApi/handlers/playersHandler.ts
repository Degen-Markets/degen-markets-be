import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import * as PlayerService from "../../players/PlayerService";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";

// ASK_ANGAD: What's a good name? GetPlayersHandler (METHOD_ENDPOINT_HANDLER) or PlayersHandler (ENDPOINT_HANDLER)

const logger = new Logger({
  serviceName: "PlayersHandler",
});

const playersHandler = async ({
  queryStringParameters: qs,
}: APIGatewayEvent) => {
  const playerListParams: Parameters<typeof PlayerService.findAllPlayers>[0] =
    {};
  if (qs) {
    if (qs.limit) {
      const limit = Number(qs.limit);
      if (isNaN(limit))
        return buildBadRequestError(`Invalid limit parameter(${qs.limit})`);

      playerListParams.limit = limit;
    }
    if (qs.offset) {
      const offset = Number(qs.offset);
      if (isNaN(offset))
        return buildBadRequestError(`Invalid offset parameter(${qs.offset})`);

      playerListParams.offset = offset;
    }
    if (qs.sort) {
      const [sortByField = "", sortDir = ""] = qs.sort.split(":");
      if (
        PlayerService.getIsValidFieldName(sortByField) &&
        PlayerService.getIsValidSortDirection(sortDir)
      ) {
        playerListParams.orderBy = { [sortByField]: sortDir };
      } else return buildBadRequestError(`Invalid sort parameter(${qs.sort})`);
    }
  }
  const players = await PlayerService.findAllPlayers(playerListParams);
  return buildOkResponse(players);
};

export default playersHandler;
