import { SmartContractEvent } from "../types";
import PoolEntriesService from "../../poolEntries/service";
import { DrizzleClient } from "../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../players/service";
import { calculatePointsEarned } from "./utils";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

const POINTS_EARNED_PER_SOL = 100n;

const logger = new Logger({
  serviceName: "PoolEnteredEventHandler",
});

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
  logger.info("Processing event", { eventData });

  const { entrant, option, pool, value: valueStr, entry } = eventData;
  const value = BigInt(valueStr);

  const db = await DrizzleClient.makeDb();

  const pointsEarned = calculatePointsEarned(value, POINTS_EARNED_PER_SOL);
  await PlayersService.insertNewOrAwardPoints(db, entrant, pointsEarned);
  await PoolEntriesService.insertNewOrIncrementValue(db, {
    address: entry,
    entrant,
    option,
    pool,
    value,
  });

  logger.info("Completed processing event", { eventData });
};
