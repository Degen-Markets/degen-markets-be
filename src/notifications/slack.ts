import axios from "axios";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "SlackNotifications" });

export const sendSlackBalanceUpdate = async (text: string) => {
  logger.info(`Slack balance update: ${text}`);
  await axios.post(
    "https://hooks.slack.com/services/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",
    {
      text,
    },
  );
};
