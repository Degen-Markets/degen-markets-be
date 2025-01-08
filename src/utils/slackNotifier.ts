import { getMandatoryEnvVariable } from "./getMandatoryEnvValue";
import axios from "axios";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "slackNotifier" });

export enum SlackChannel {
  PROD_ALERTS = "prod-alerts",
  DEV_ALERTS = "dev-alerts",
}

type SlackMessage = {
  type: "error" | "warning" | "info";
  title: string;
  details: Record<string, any>;
  error?: Error;
};

const getSlackWebhookUrl = (channel: SlackChannel): string => {
  const envKey = `SLACK_${channel.toUpperCase().replace("-", "_")}_WEBHOOK_URL`;
  return getMandatoryEnvVariable(envKey); // SLACK_PROD_ALERTS_WEBHOOK_URL | SLACK_DEV_ALERTS_WEBHOOK_URL
};

const formatErrorBlock = (error?: Error) => {
  if (!error) return null;

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Stack Trace:*\n\`\`\`${error.stack || error.message}\`\`\``,
    },
  };
};

const formatDetailsBlock = (details: Record<string, any>) => {
  const formattedDetails = Object.entries(details)
    .map(([key, value]) => `*${key}:* ${JSON.stringify(value, null, 2)}`)
    .join("\n");

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: formattedDetails,
    },
  };
};

export const sendSlackNotification = async (
  channel: SlackChannel,
  message: SlackMessage,
): Promise<void> => {
  try {
    const webhookUrl = getSlackWebhookUrl(channel);

    const emoji =
      message.type === "error"
        ? "🚨"
        : message.type === "warning"
          ? "⚠️"
          : "ℹ";

    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${message.title}*`,
        },
      },
      formatDetailsBlock(message.details),
    ];

    if (message.error) {
      blocks.push(formatErrorBlock(message.error)!);
    }

    await axios.post(webhookUrl, {
      blocks: blocks.filter(Boolean),
    });

    logger.info("Successfully sent Slack notification", {
      channel,
      messageType: message.type,
      title: message.title,
    });
  } catch (error) {
    logger.error("Failed to send Slack notification", {
      channel,
      error: error instanceof Error ? error.message : String(error),
      messageType: message.type,
      title: message.title,
    });
  }
};
