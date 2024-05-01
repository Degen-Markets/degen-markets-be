import { Hex } from "viem";
import {
  SmartContractEventBody,
  SmartContractEvents,
} from "../../smartContractEventProcessor/smartContractEventTypes";
import { UUID } from "crypto";

export type SettleBetWebhookEvent = {
  webhookId: string;
  id: string;
  createdAt: string;
  type: "GRAPHQL";
  event: {
    data: {
      block: {
        hash: Hex;
        timestamp: number;
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

export type SettleBetContractEvent = {
  id: UUID;
  winner: Hex;
};

export interface SettleBetSqsEvent extends SmartContractEventBody {
  winner: Hex;
  winTimestamp: number;
}

export interface SettleBetSqsEvents extends SmartContractEvents {
  eventName: "BetSettled";
  bets: SettleBetSqsEvent[];
}
