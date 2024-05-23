import { Logger } from "@aws-lambda-powertools/logger";
import {
  isAcceptBetSqsEvent,
  isCreateBetSqsEvent,
  isSettleBetSqsEvent,
  isWithdrawBetSqsEvent,
  SmartContractEvents,
} from "./smartContractEventTypes";
import { BetCreatedSqsEvents } from "../webhookApi/types/BetCreatedTypes";
import { BetService } from "../bets/BetService";
import { BetAcceptedSqsEvents } from "../webhookApi/types/BetAcceptedTypes";
import { WithdrawBetSqsEvents } from "../webhookApi/types/WithdrawBetTypes";
import { QuotesService } from "../quotes/QuotesService";
import { getCmcId } from "../utils/cmcApi";
import { SettleBetSqsEvents } from "../webhookApi/types/SettleBetTypes";

export class SmartContractEventService {
  private readonly logger = new Logger({
    serviceName: "SmartContractEventService",
  });

  private betService = new BetService();
  private quotesService = new QuotesService();
  handleCreateBets = async (createBetSqsEvents: BetCreatedSqsEvents) => {
    try {
      await this.betService.createV2Bets(createBetSqsEvents.bets);
    } catch (e) {
      this.logger.error(`Error inserting V2 Bet:`, e as Error);
      await this.betService.createBets(createBetSqsEvents.bets);
    }
  };

  handleAcceptBets = async (acceptBetSqsEvents: BetAcceptedSqsEvents) => {
    const bets = await Promise.all(
      acceptBetSqsEvents.bets.map(async (bet) => {
        const storedBet = await this.betService.findOne(bet.id);
        return {
          ...bet,
          startingMetricValue: await this.quotesService.getLatestQuote(
            getCmcId(storedBet.ticker),
            storedBet.metric,
          ),
        };
      }),
    );
    try {
      await this.betService.acceptV2Bets(bets);
    } catch (e) {
      this.logger.error(`Error inserting V2 Bet:`, e as Error);
      await this.betService.acceptBets(bets);
    }
  };

  handleWithdrawBets = async (withdrawBetSqsEvents: WithdrawBetSqsEvents) => {
    await this.betService.withdrawBets(withdrawBetSqsEvents.bets);
  };

  handleSettleBets = async (settleBetSqsEvents: SettleBetSqsEvents) => {
    await this.betService.settleBets(settleBetSqsEvents.bets);
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
    } else if (isSettleBetSqsEvent(smartContractEvents)) {
      await this.handleSettleBets(smartContractEvents);
    }
  };
}
