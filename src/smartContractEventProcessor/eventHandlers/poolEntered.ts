import { SmartContractEvent } from "../types";
import PoolEntriesService from "../../poolEntries/service";
import { DrizzleClient } from "../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";
import PlayersService from "../../players/service";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

const logger = new Logger({
  serviceName: "PoolEnteredEventHandler",
});

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
  logger.info("Processing event", { eventData });

  const { entrant, option, pool, value, entry } = eventData;

  const db = await DrizzleClient.makeDb();

  // TODO: Add points logic
  await PlayersService.upsert(db, {
    address: entrant,
  });
  await PoolEntriesService.insertOrUpdate(db, {
    address: entry,
    entrant,
    option,
    pool,
    value: BigInt(value),
  });

  logger.info("Completed processing event", { eventData });
};
