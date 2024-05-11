import { Logger } from "@aws-lambda-powertools/logger";
import { tickerToCmcId } from "../utils/cmcApi";

const logger = new Logger({ serviceName: "QuotesImporter" });

export const handler = async () => {
  logger.info(`Importing quotes for currencies ${Object.keys(tickerToCmcId)}`);
};
