import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SQSEvent } from "aws-lambda";
import { buildOkResponse } from "../utils/httpResponses";
import { poolEnteredEventHandler } from "./eventHandlers/poolEntered";
import { tryIt } from "../utils/tryIt";
import { SmartContractEvent } from "./types";

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

    default:
      logger.warn(`${smartContractEvent.eventName} events are not handled`, {
        event: smartContractEvent,
      });
  }
};

export const handler = middy(handleSqsEvent).use(
  injectLambdaContext(logger, { logEvent: true }),
);
