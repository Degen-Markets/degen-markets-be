import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { SQSEvent } from "aws-lambda";

const logger = new Logger({ serviceName: "smartContractEventProcessor" });

const handleSmartContractEvent = async (event: SQSEvent) => {
  return 200;
};

export const handler = middy(handleSmartContractEvent).use(
  injectLambdaContext(logger, { logEvent: true }),
);
