import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import axios from "axios";
import { Logger } from "@aws-lambda-powertools/logger";

class NotificationsService {
  private readonly logger = new Logger({ serviceName: "NotificationsService" });
  async sendTelegramMessage(text: string) {
    const telegramBotApiKey = getMandatoryEnvVariable("TELEGRAM_BOT_KEY");
    const telegramChatId = getMandatoryEnvVariable("TELEGRAM_CHAT_ID");
    this.logger.info(`Sending tg message with text: ${text}`);
    await axios.post(
      `https://api.telegram.org/bot${telegramBotApiKey}/sendMessage`,
      {
        chat_id: Number(telegramChatId),
        text,
      },
    );
  }

  async sendSlackBalanceUpdate(text: string) {
    this.logger.info(`Slack balance update: ${text}`);
    await axios.post(
      "https://hooks.slack.com/services/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",
      {
        text,
      },
    );
  }
}

export default NotificationsService;
