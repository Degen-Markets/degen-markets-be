import { Logger } from "@aws-lambda-powertools/logger";
import { PlayerEntity } from "./types";
import { DrizzleClient } from "../clients/DrizzleClient";
import { playersTable, playersTableColumnNames } from "./schema";
import { typedObjectEntries, typedObjectKeys } from "../../lib/utils";
import { SQL, asc, desc } from "drizzle-orm";

const MAX_PLAYERS_RETURNED_LIMIT = 10;
const DEFAULT_PLAYERS_OFFSET = 0;

// This should probably be in a separate file, cause it deals with query string details
export enum ESortDirections {
  ASC = "ASC", // ascending
  DESC = "DESC", // descending
}

const logger = new Logger({ serviceName: "PlayerService" });

export const getIsValidFieldName = (
  inputStr: string,
): inputStr is keyof PlayerEntity => {
  return playersTableColumnNames.includes(inputStr as any);
};

export const getIsValidSortDirection = (
  inputStr: string,
): inputStr is ESortDirections => {
  return typedObjectKeys(ESortDirections).includes(inputStr as any);
};

export const findAllPlayers = async ({
  limit: limitVal = MAX_PLAYERS_RETURNED_LIMIT,
  offset: offsetVal = DEFAULT_PLAYERS_OFFSET,
  orderBy: orderByVal = { points: ESortDirections.DESC },
}: {
  limit?: number;
  offset?: number;
  orderBy?: Partial<Record<keyof PlayerEntity, ESortDirections>>;
} = {}): Promise<PlayerEntity[]> => {
  // refine args
  const effectiveLimitVal =
    limitVal < MAX_PLAYERS_RETURNED_LIMIT
      ? limitVal
      : MAX_PLAYERS_RETURNED_LIMIT;

  logger.info(
    `fetching players with params: ${JSON.stringify({ limit: effectiveLimitVal, offset: offsetVal, orderByVal })}`,
  );

  // transformations
  const orderByValEntries = typedObjectEntries(orderByVal).reduce(
    (list, [fieldName, direction]) => {
      // only add as an orderBy clause, if there is a valid direction
      if (direction && getIsValidSortDirection(direction)) {
        const newOrderEntry =
          direction === ESortDirections.ASC
            ? asc(playersTable[fieldName])
            : desc(playersTable[fieldName]);
        return list.concat(newOrderEntry);
      }
      return list;
    },
    [] as SQL<unknown>[],
  );

  const db = await DrizzleClient.makeDb();
  const playersArr = await db
    .select()
    .from(playersTable)
    .orderBy(...orderByValEntries)
    .limit(effectiveLimitVal)
    .offset(offsetVal);

  logger.debug(JSON.stringify(playersArr));
  return playersArr;
};
