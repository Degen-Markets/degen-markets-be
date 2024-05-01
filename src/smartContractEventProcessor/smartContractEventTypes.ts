import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";
import { UUID } from "crypto";
import { AcceptBetSqsEvents } from "../webhookApi/types/AcceptBetTypes";
import { WithdrawBetSqsEvents } from "../webhookApi/types/WithdrawBetTypes";
import { SettleBetSqsEvents } from "../webhookApi/types/SettleBetTypes";

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

export const isWithdrawBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is WithdrawBetSqsEvents =>
  smartContractEvents.eventName === "BetWithdrawn";

export const isSettleBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is SettleBetSqsEvents =>
  smartContractEvents.eventName === "BetSettled";
