import { Logger } from "@aws-lambda-powertools/logger";
import { PlayerEntity } from "./types";
import { DrizzleClient } from "../clients/DrizzleClient";
import { playersTable } from "./schema";
import { typedObjectEntries } from "../utils/typedStdLib";
import { SQL, asc, desc } from "drizzle-orm";
import { ESortDirections } from "../utils/queryString";

const logger = new Logger({ serviceName: "PlayerService" });

export const findAllPlayers = async ({
  limit: limitVal,
  offset: offsetVal,
  orderBy: orderByVal = { points: ESortDirections.DESC },
}: {
  limit?: number;
  offset?: number;
  orderBy?: Partial<Record<keyof PlayerEntity, ESortDirections>>;
} = {}): Promise<PlayerEntity[]> => {
  // transformations
  const orderByValEntries = typedObjectEntries(orderByVal).reduce(
    (list, [fieldName, direction]) => {
      // only add as an `orderBy` clause if there is a valid direction
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
  let query = db.select().from(playersTable).$dynamic(); // base query

  // conditionally filter
  if (orderByValEntries.length) query = query.orderBy(...orderByValEntries);
  if (limitVal) query = query.limit(limitVal);
  if (offsetVal) query = query.offset(offsetVal);

  // execute
  const playersArr = await query;

  logger.debug(
    `Players fetched with filter args ${JSON.stringify({ limit: limitVal, offset: offsetVal, orderBy: orderByVal })}. Result is ${JSON.stringify(playersArr)}`,
  );
  return playersArr;
};
