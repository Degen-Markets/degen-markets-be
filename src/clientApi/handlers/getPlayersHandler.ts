import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import * as PlayerService from "../../players/PlayerService";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";
import { ESortDirections } from "../../utils/queryString";
import { playersTableColumnNames } from "../../players/schema";
import { tryIt } from "../../utils/tryIt";
import getParamToListPlayersFromQs from "./utils/getParamToListPlayersFromQs";

const MAX_PLAYERS_RETURNED_LIMIT = 10;
const ALLOWED_SORT_COLS = ["points"] satisfies typeof playersTableColumnNames;
const DEFAULT_ORDER_BY = { points: ESortDirections.DESC };

const logger = new Logger({
  serviceName: "GetPlayersHandler",
});

const playersHandler = async ({
  queryStringParameters: qs,
}: APIGatewayEvent) => {
  logger.info(
    `fetching players with querystring params: ${JSON.stringify(qs)}`,
  );
  const getParamToListPlayersFromQsTrial = tryIt(() =>
    getParamToListPlayersFromQs(qs, {
      maxPlayersReturned: MAX_PLAYERS_RETURNED_LIMIT,
      defaultOrderBy: DEFAULT_ORDER_BY,
      allowedSortCols: ALLOWED_SORT_COLS,
    }),
  );
  if (!getParamToListPlayersFromQsTrial.success) {
    const { err } = getParamToListPlayersFromQsTrial;
    if (typeof err === "string") logger.error(err);
    return buildBadRequestError(
      `Bad query string parameters (${JSON.stringify(qs)})`,
    );
  }

  const playersList = await PlayerService.findAllPlayers(
    getParamToListPlayersFromQsTrial.data,
  );
  logger.info(`Successfully fetched players for qs=${JSON.stringify(qs)}`);
  return buildOkResponse(playersList);
};

export default playersHandler;
