import { Logger } from "@aws-lambda-powertools/logger";
import {
  isAcceptBetSqsEvent,
  isCreateBetSqsEvent,
  isWithdrawBetSqsEvent,
  SmartContractEvents,
} from "./smartContractEventTypes";
import { CreateBetSqsEvents } from "../webhookApi/types/CreateBetTypes";
import { BetService } from "../bets/BetService";
import { AcceptBetSqsEvents } from "../webhookApi/types/AcceptBetTypes";
import { WithdrawBetSqsEvents } from "../webhookApi/types/WithdrawBetTypes";

export class SmartContractEventService {
  private readonly logger = new Logger({
    serviceName: "SmartContractEventService",
  });

  private betService = new BetService();
  handleCreateBets = async (createBetSqsEvents: CreateBetSqsEvents) => {
    await this.betService.createBets(createBetSqsEvents.bets);
  };

  handleAcceptBets = async (acceptBetSqsEvents: AcceptBetSqsEvents) => {
    await this.betService.acceptBets(acceptBetSqsEvents.bets);
  };

  handleWithdrawBets = async (withdrawBetSqsEvents: WithdrawBetSqsEvents) => {
    await this.betService.withdrawBets(withdrawBetSqsEvents.bets);
  };

  handleSmartContractEvents = async (
    smartContractEvents: SmartContractEvents,
  ) => {
    this.logger.info(
      `handling ${smartContractEvents.bets.length} ${smartContractEvents.eventName} contract event(s)`,
    );
    if (isCreateBetSqsEvent(smartContractEvents)) {
      await this.handleCreateBets(smartContractEvents);
    } else if (isAcceptBetSqsEvent(smartContractEvents)) {
      await this.handleAcceptBets(smartContractEvents);
    } else if (isWithdrawBetSqsEvent(smartContractEvents)) {
      await this.handleWithdrawBets(smartContractEvents);
    }
  };
}
