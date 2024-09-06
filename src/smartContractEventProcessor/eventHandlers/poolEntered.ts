import { SmartContractEvent } from "../types";
import PoolEntrantsService from "../../poolEntrants/service";
import PoolEntriesService from "../../poolEntries/service";
import { DrizzleClient } from "../../clients/DrizzleClient";
import { Logger } from "@aws-lambda-powertools/logger";

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

  await PoolEntrantsService.insertOrIgnore(db, entrant);
  await PoolEntriesService.insertOrUpdate(db, {
    address: entry,
    entrant,
    option,
    pool,
    value: BigInt(value),
  });

  logger.info("Completed processing event", { eventData });
};
