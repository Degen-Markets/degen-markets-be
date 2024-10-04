import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SQSEvent } from "aws-lambda";
import { buildOkResponse } from "../utils/httpResponses";
import poolEnteredEventHandler from "./eventHandlers/poolEntered";
import { tryIt } from "../utils/tryIt";
import { SmartContractEvent } from "./types";
import poolCreatedEventHandler from "./eventHandlers/poolCreated";
import optionCreatedEventHandler from "./eventHandlers/optionCreated";
import winnerSetEventHandler from "./eventHandlers/winnerSet";
import poolStatusUpdatedEventHandler from "./eventHandlers/poolStatusUpdate";

const logger = new Logger({ serviceName: "smartContractEventProcessor" });

const handleSqsEvent = async (sqsEvent: SQSEvent) => {
  await Promise.all(
    sqsEvent.Records.map(async (record) => {
      await handleRecord(record);
    }),
  );
  return buildOkResponse("SQS event processor ran successfully");
};

const handleRecord = async (record: SQSEvent["Records"][0]) => {
  const eventParseTrial = tryIt(
    () => JSON.parse(record.body) as SmartContractEvent,
  );
  if (!eventParseTrial.success) {
    logger.error("Failed to parse smart contract event from record body", {
      error: eventParseTrial.err,
      recordBody: record.body,
    });
    return;
  }
  await forwardToEventHandler(eventParseTrial.data);
};

const forwardToEventHandler = async (
  smartContractEvent: SmartContractEvent,
) => {
  switch (smartContractEvent.eventName) {
    case "poolEntered":
      logger.info("Processing `poolEntered` event", {
        event: smartContractEvent,
      });
      await poolEnteredEventHandler(smartContractEvent.data);
      break;

    case "poolCreated":
      logger.info("Processing `poolCreated` event", {
        event: smartContractEvent,
      });
      await poolCreatedEventHandler(smartContractEvent.data);
      break;

    case "optionCreated":
      logger.info("Processing `optionCreated` event", {
        event: smartContractEvent,
      });
      await optionCreatedEventHandler(smartContractEvent.data);
      break;

    case "poolStatusUpdated":
      logger.info("Processing `poolStatusUpdated` event", {
        event: smartContractEvent,
      });
      await poolStatusUpdatedEventHandler(smartContractEvent.data);
      break;

    case "winnerSet":
      logger.info("Processing `winnerSet` event", {
        event: smartContractEvent,
      });
      await winnerSetEventHandler(smartContractEvent.data);
      break;

    default:
      logger.warn(`Event not handled`, {
        event: smartContractEvent,
      });
  }
};

export const handler = middy(handleSqsEvent).use(
  injectLambdaContext(logger, { logEvent: true }),
);
