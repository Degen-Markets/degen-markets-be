import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SettlementService } from "./SettlementService";
import NotificationsService from "../notifications/NotificationsService";

const logger = new Logger({ serviceName: "settler" });
const settlementService = new SettlementService();

export const handleSettlement = async () => {
  const bets = await settlementService.handleSettlement();
  const notificationsService = new NotificationsService();
  try {
    await Promise.all(
      bets.map((bet) =>
        notificationsService.sendTelegramMessage(
          `Bet Settled: https://degenmarkets.com/bets/${bet.id}`,
        ),
      ),
    );
  } catch (e) {
    logger.error("Error sending settle bet tg messages", e as Error);
  }
};

export const handler = middy(handleSettlement).use(
  injectLambdaContext(logger, { logEvent: true }),
);
