import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "AITweeter" });

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
};
