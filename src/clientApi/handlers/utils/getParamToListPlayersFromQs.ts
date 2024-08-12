import { APIGatewayEvent } from "aws-lambda";
import * as PlayerService from "../../../players/PlayerService";
import { PlayerEntity } from "../../../players/types";
import { ESortDirections } from "../../../utils/queryString";
import { playersTableColumnNames } from "../../../players/schema";
import { typedIncludes, typedObjectKeys } from "../../../utils/typedStdLib";

type ParamToListPlayers = NonNullable<
  Parameters<typeof PlayerService.findAllPlayers>[0]
>;

export default function getParamToListPlayersFromQs(
  qs: APIGatewayEvent["queryStringParameters"],
  {
    maxPlayersReturned,
    defaultOrderBy,
    allowedSortCols,
  }: {
    maxPlayersReturned: number;
    defaultOrderBy: Partial<Record<keyof PlayerEntity, ESortDirections>>;
    allowedSortCols: typeof playersTableColumnNames;
  },
): ParamToListPlayers {
  const result: Parameters<typeof PlayerService.findAllPlayers>[0] = {
    limit: maxPlayersReturned,
    orderBy: defaultOrderBy,
  };
  if (qs) {
    if (qs.limit) {
      const limit = Number(qs.limit);
      if (isNaN(limit)) throw new Error(`Invalid limit parameter(${qs.limit})`);

      result.limit = limit < maxPlayersReturned ? limit : maxPlayersReturned;
    }
    if (qs.offset) {
      const offset = Number(qs.offset);
      if (isNaN(offset)) {
        throw new Error(`Invalid offset parameter(${qs.offset})`);
      }

      result.offset = offset;
    }
    if (qs.sort) {
      const [sortByField = "", sortDir = ESortDirections.DESC] =
        qs.sort.split(":");
      if (
        typedIncludes(allowedSortCols, sortByField) &&
        typedIncludes(typedObjectKeys(ESortDirections), sortDir)
      ) {
        result.orderBy = {
          [sortByField]:
            sortDir === "ASC" ? ESortDirections.ASC : ESortDirections.DESC,
        };
      } else throw new Error(`Invalid sort parameter(${qs.sort})`);
    }
  }

  return result;
}
