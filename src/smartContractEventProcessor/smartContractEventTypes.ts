import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";
import { UUID } from "crypto";
import { AcceptBetSqsEvents } from "../webhookApi/types/AcceptBetTypes";

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

export const isAcceptBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is AcceptBetSqsEvents =>
  smartContractEvents.eventName === "BetAccepted";
