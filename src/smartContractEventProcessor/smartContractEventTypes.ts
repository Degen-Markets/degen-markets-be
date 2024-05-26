import { BetCreatedSqsEvents } from "../webhookApi/types/BetCreatedTypes";
import { UUID } from "crypto";
import { BetAcceptedSqsEvents } from "../webhookApi/types/BetAcceptedTypes";
import { BetWithdrawnSqsEvents } from "../webhookApi/types/BetWithdrawnTypes";
import { SettleBetSqsEvents } from "../webhookApi/types/SettleBetTypes";
import { BetPaidSqsEvents } from "../webhookApi/types/BetPaidTypes";

export interface SmartContractEventBody {
  id: UUID;
}

export type SmartContractEvents = {
  eventName: string;
  bets: SmartContractEventBody[];
};

export const isCreateBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is BetCreatedSqsEvents =>
  smartContractEvents.eventName === "BetCreated";

export const isAcceptBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is BetAcceptedSqsEvents =>
  smartContractEvents.eventName === "BetAccepted";

export const isWithdrawBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is BetWithdrawnSqsEvents =>
  smartContractEvents.eventName === "BetWithdrawn";

export const isSettleBetSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is SettleBetSqsEvents =>
  smartContractEvents.eventName === "BetSettled";

export const isBetPaidSqsEvent = (
  smartContractEvents: SmartContractEvents,
): smartContractEvents is BetPaidSqsEvents =>
  smartContractEvents.eventName === "BetPaid";
