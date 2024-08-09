import { Logger } from "@aws-lambda-powertools/logger";
import { PlayerEntity } from "./types";
import { DrizzleClient } from "../clients/DrizzleClient";
import { playersTable } from "./schema";
import { typedObjectEntries } from "../utils/typedStdLib";
import { SQL, asc, count, desc, eq, inArray, or, sql, sum } from "drizzle-orm";
import { ESortDirections } from "../utils/queryString";
import { betsTable } from "../bets/schema";

const logger = new Logger({ serviceName: "PlayerService" });

type CountsData = { betCount: number; winCount: number };
type ExtendedPlayerEntity = PlayerEntity & CountsData;

export const findAllPlayers = async ({
  limit: limitVal,
  offset: offsetVal,
  orderBy: orderByVal = {},
}: {
  limit?: number;
  offset?: number;
  orderBy?: Partial<Record<keyof PlayerEntity, ESortDirections>>;
} = {}): Promise<ExtendedPlayerEntity[]> => {
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

  // extended data from bets table
  const playerCountsData: Record<PlayerEntity["address"], CountsData> = {};
  await Promise.all(
    playersArr.map(async (player) => {
      const countData: CountsData | undefined = (
        await db
          .select({
            betCount: count(),
            winCount: sum(
              sql`CASE WHEN LOWER(${betsTable.winner}) = LOWER(${player.address}) THEN 1 ELSE 0 END`,
            ).mapWith(Number),
          })
          .from(betsTable)
          .where(
            or(
              eq(betsTable.creator, player.address),
              eq(betsTable.acceptor, player.address),
            ),
          )
      )[0];
      playerCountsData[player.address] = countData;
    }),
  );

  // doing it this way ensures the order from the initial sort query is conserved
  const playersWithCountsArr: ExtendedPlayerEntity[] = playersArr.map(
    (playerBaseData) => ({
      ...playerBaseData,
      ...playerCountsData[playerBaseData.address],
    }),
  );

  logger.debug(
    `Players fetched with filter args ${JSON.stringify({ limit: limitVal, offset: offsetVal, orderBy: orderByVal })}. Result is ${JSON.stringify(playersWithCountsArr)}`,
  );
  return playersWithCountsArr;
};
