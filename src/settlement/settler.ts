import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SettlementService } from "./SettlementService";
import { sendTelegramMessage } from "../notifications/telegram";
import { sendTweet } from "../notifications/twitter";

const logger = new Logger({ serviceName: "settler" });
const settlementService = new SettlementService();

export const handleSettlement = async () => {
  const bets = await settlementService.handleSettlement();
  if (bets.length > 0) {
    const notificationMessage = `Bet(s) Won:\n\n${bets.map((bet) => `https://degenmarkets.com/bets/${bet.id}`).join("\n")}`;
    try {
      await sendTelegramMessage(notificationMessage);
    } catch (e) {
      logger.error("Error sending settle bet tg messages", e as Error);
    }

    try {
      await sendTweet(notificationMessage);
    } catch (e) {
      logger.error("Error sending settle bet tweet", e as Error);
    }
  }
};

export const handler = middy(handleSettlement).use(
  injectLambdaContext(logger, { logEvent: true }),
);
