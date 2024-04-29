import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";

export interface SmartContractEventBody {
  id: string;
}

export type SmartContractEvents = {
  eventName: string;
  bets: SmartContractEventBody[];
};

export const isCreateBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is CreateBetSqsEvents =>
  smartContractEvents.eventName === "BetCreated";
