import { SmartContractEvent } from "../types";
import PoolEntriesService from "../../poolEntries/service";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../players/service";
import { calculatePointsEarned } from "./utils";
import BN from "bn.js";
import PoolOptionsService from "../../poolOptions/service";
import PoolsService from "../../pools/service";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

const POINTS_EARNED_PER_SOL = 100;

const logger = new Logger({
  serviceName: "PoolEnteredEventHandler",
});

const poolEnteredEventHandler = async (eventData: PoolEnteredEventData) => {
  logger.info("Processing PoolEntered event", { eventData });

  const { entrant, option, pool, value: valueStr, entry } = eventData;
  const pointsEarned = calculatePointsEarned(
    new BN(valueStr),
    POINTS_EARNED_PER_SOL,
  );
  logger.info(`Points calculation returned ${pointsEarned}`);

  await Promise.all([
    PlayersService.insertNewOrAwardPoints(entrant, pointsEarned),
    PoolEntriesService.insertNewOrIncrementValue({
      address: entry,
      entrant,
      option,
      pool,
      value: valueStr,
    }),
    PoolsService.incrementValue(pool, valueStr),
    PoolOptionsService.incrementValue(option, valueStr),
  ]);

  logger.info("Completed processing PoolEntered event", { eventData });
};

export default poolEnteredEventHandler;
