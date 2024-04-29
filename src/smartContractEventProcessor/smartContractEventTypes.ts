import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";
import { UUID } from "crypto";

export interface SmartContractEventBody {
  id: UUID;
}

export type SmartContractEvents = {
  eventName: string;
  bets: SmartContractEventBody[];
};

export const isCreateBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is CreateBetSqsEvents =>
  smartContractEvents.eventName === "BetCreated";
