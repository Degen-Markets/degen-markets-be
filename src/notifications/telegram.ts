import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import axios from "axios";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "TelegramNotifications" });

export const sendTelegramMessage = async (text: string) => {
  const telegramBotApiKey = getMandatoryEnvVariable("TELEGRAM_BOT_KEY");
  const telegramChatId = getMandatoryEnvVariable("TELEGRAM_CHAT_ID");
  logger.info(`Sending tg message with text: ${text}`);
  await axios.post(
    `https://api.telegram.org/bot${telegramBotApiKey}/sendMessage`,
    {
      chat_id: Number(telegramChatId),
      text,
    },
  );
};
