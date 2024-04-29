import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

export type WithdrawBetWebhookEvent = {
  webhookId: string;
  id: string;
  createdAt: string;
  type: "GRAPHQL";
  event: {
    data: {
      block: {
        hash: Hex;
        logs: {
          data: Hex;
          topics: Hex[];
          transaction: {
            hash: Hex;
            from: {
              address: Hex;
            };
            value: Hex;
            status: 1 | 2; // 1 is "confirmed"
          };
        }[];
      };
    };
  };
};

export type WithdrawBetContractEvent = {
  id: UUID;
};

export interface WithdrawBetSqsEvent extends SmartContractEventBody {}

export interface WithdrawBetSqsEvents extends SmartContractEvents {
  eventName: "BetWithdrawn";
  bets: WithdrawBetSqsEvent[];
}
