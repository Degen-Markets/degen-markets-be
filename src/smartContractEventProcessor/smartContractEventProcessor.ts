import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SmartContractEventService } from "./SmartContractEventService";
import { SQSEvent } from "aws-lambda";

const logger = new Logger({ serviceName: "smartContractEventProcessor" });
const smartContractEventService = new SmartContractEventService();

const handleSmartContractEvent = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const smartContractEvent = JSON.parse(record.body);
    await smartContractEventService.handleSmartContractEvent(
      smartContractEvent,
    );
  }
};

export const handler = middy(handleSmartContractEvent).use(
  injectLambdaContext(logger, { logEvent: true }),
);
