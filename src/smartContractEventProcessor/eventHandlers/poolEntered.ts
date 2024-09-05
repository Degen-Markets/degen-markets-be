import { NarrowRecord } from "../../utils/types";
import { SmartContractEvent } from "../types";

type PoolEnteredEventData = NarrowRecord<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
  console.log(eventData);
};
