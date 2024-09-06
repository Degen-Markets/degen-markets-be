import { SmartContractEvent } from "../types";

type PoolEnteredEventData = Extract<
  SmartContractEvent,
  { eventName: "poolEntered" }
>["data"];

export const poolEnteredEventHandler = async (
  eventData: PoolEnteredEventData,
) => {
  console.log(eventData);
};
