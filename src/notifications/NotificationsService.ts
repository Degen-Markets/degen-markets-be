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
}

export default NotificationsService;
