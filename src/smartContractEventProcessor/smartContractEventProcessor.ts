import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SQSEvent } from "aws-lambda";
import { SmartContractEvents } from "./smartContractEventTypes";
import { SmartContractEventService } from "./SmartContractEventService";

const logger = new Logger({ serviceName: "smartContractEventProcessor" });
const smartContractEventService = new SmartContractEventService();

const handleSmartContractEvent = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const smartContractEvents = JSON.parse(record.body) as SmartContractEvents;
    await smartContractEventService.handleSmartContractEvents(
      smartContractEvents,
    );
  }
  return 200;
};

export const handler = middy(handleSmartContractEvent).use(
  injectLambdaContext(logger, { logEvent: true }),
);
