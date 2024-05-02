import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import axios from "axios";
import { Logger } from "@aws-lambda-powertools/logger";

class NotificationsService {
  private readonly logger = new Logger({ serviceName: "NotificationsService" });
  private readonly telegramBotApiKey =
    getMandatoryEnvVariable("TELEGRAM_BOT_KEY");
  private readonly telegramChatId = getMandatoryEnvVariable("TELEGRAM_CHAT_ID");
  async sendTelegramMessage(text: string) {
    this.logger.info(`Sending tg message with text: ${text}`);
    await axios.post(
      `https://api.telegram.org/bot${this.telegramBotApiKey}/sendMessage`,
      {
        chat_id: Number(this.telegramChatId),
        text,
      },
    );
  }

  async sendSlackBetUpdate(text: string) {
    this.logger.info(`Sending slack bet update with text: ${text}`);
    await axios.post(
      "https://hooks.slack.com/services/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",
      {
        text,
      },
    );
  }
}

export default NotificationsService;
