import { SmartContractEvent } from "../types";
import PoolEntrantsService from "../../poolEntrants/service";
import PoolEntriesService from "../../poolEntries/service";
import { DrizzleClient } from "../../clients/DrizzleClient";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
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
};
