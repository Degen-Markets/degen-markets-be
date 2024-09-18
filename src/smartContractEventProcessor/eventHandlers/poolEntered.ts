import { SmartContractEvent } from "../types";
import PoolEntriesService from "../../poolEntries/service";
import { DrizzleClient } from "../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../players/service";
import { calculatePointsEarned } from "./utils";
import BN from "bn.js";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

const POINTS_EARNED_PER_SOL = 100;

const logger = new Logger({
  serviceName: "PoolEnteredEventHandler",
});

const playerService = new PlayersService();

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
  logger.info("Processing event", { eventData });

  const { entrant, option, pool, value: valueStr, entry } = eventData;

  const pointsEarned = calculatePointsEarned(
    new BN(valueStr),
    POINTS_EARNED_PER_SOL,
  );
  logger.info(`Points calculation returned ${pointsEarned}`);

  await playerService.insertNewOrAwardPoints(entrant, pointsEarned);

  const db = await DrizzleClient.makeDb();
  await PoolEntriesService.insertNewOrIncrementValue(db, {
    address: entry,
    entrant,
    option,
    pool,
    value: valueStr,
  });

  logger.info("Completed processing event", { eventData });
};
