import { Logger } from "@aws-lambda-powertools/logger";
import { PlayerEntity } from "./types";
import { DrizzleClient } from "../clients/DrizzleClient";
import { playersTable } from "./schema";
import { typedObjectEntries } from "../utils/typedStdLib";
import { SQL, asc, desc } from "drizzle-orm";
import { ESortDirections } from "../utils/queryString";

const MAX_PLAYERS_RETURNED_LIMIT = 10;
const DEFAULT_PLAYERS_OFFSET = 0;

const logger = new Logger({ serviceName: "PlayerService" });

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

  // transformations
  const orderByValEntries = typedObjectEntries(orderByVal).reduce(
    (list, [fieldName, direction]) => {
      // only add as an orderBy clause, if there is a valid direction
      if (!direction) return list;

      const newOrderEntry =
        direction === ESortDirections.ASC
          ? asc(playersTable[fieldName])
          : desc(playersTable[fieldName]);
      return list.concat(newOrderEntry);
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
