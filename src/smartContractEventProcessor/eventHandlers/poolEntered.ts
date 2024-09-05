import { SmartContractEvent } from "../types";
import { insertOrIgnorePoolEntrant } from "../../poolEntrants/service";
import { insertOrUpdatePoolEntry } from "../../poolEntries/service";
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

  await insertOrIgnorePoolEntrant(db, entrant);

  await insertOrUpdatePoolEntry(
    db,
    entry,
    entrant,
    option,
    pool,
    BigInt(value),
  );
};
