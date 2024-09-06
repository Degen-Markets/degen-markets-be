import { Logger } from "@aws-lambda-powertools/logger";
import { program } from "../../solanaActions/constants";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";
import { tryIt, tryItAsync } from "../../utils/tryIt";
import { APIGatewayEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { typedIncludes } from "../../utils/typedStdLib";
import { SmartContractEvent } from "../../smartContractEventProcessor/types";

const VALID_EVENTS = [
  "poolEntered",
] satisfies (typeof program.idl.events)[number]["name"][];

const logger = new Logger({
  serviceName: "PoolInteractionsHandler",
});

export const poolInteractionsHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResultV2> => {
  const parseTrial = tryIt(() => JSON.parse(String(event.body)));
  if (!parseTrial.success) {
    logger.error("Invalid event body", {
      error: parseTrial.err,
      body: event.body,
    });
    return buildBadRequestError("Missing or invalid event body");
  }
  const parsedBody = parseTrial.data;

  const logMessages = parsedBody[0]?.meta?.logMessages;
  if (
    !Array.isArray(logMessages) ||
    logMessages.length === 0 ||
    !logMessages.every((message) => typeof message === "string")
  ) {
    logger.error("Invalid log messages structure", { parsedBody });
    return buildBadRequestError("Invalid log messages structure");
  }

  const programDataLogs = logMessages.filter((log: string) =>
    log.startsWith("Program data: "),
  );

  const smartContractEvents = programDataLogs
    .map(mapLogToEventOrNull)
    .filter((event) => event !== null) as SmartContractEvent[]; // `.filter` doesn't narrow the type apparently (https://stackoverflow.com/a/63541957)

  const sqs = new SQS();
  const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
  const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
  const concatenatedSignatures = parsedBody[0].signatures.join("-");

  const sendMessagePromises = smartContractEvents.map(async (event) => {
    if (!typedIncludes(VALID_EVENTS, event.eventName)) return;

    const result = await tryItAsync(async () => {
      const messageBody = JSON.stringify(event);
      sqs.sendMessage({
        MessageBody: messageBody,
        QueueUrl: queueUrl,
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: `${event.eventName}-${concatenatedSignatures}-${Date.now()}`,
      });
    });

    if (!result.success) {
      logger.error(`Failed to send ${event.eventName} event to SQS`, {
        error: result.err,
        event,
      });
      return;
    }

    logger.info(`Sent ${event.eventName} event to SQS`, { event });
  });

  await Promise.all(sendMessagePromises);

  return buildOkResponse({ message: "Events processor completed run" });
};

function mapLogToEventOrNull(log: string): SmartContractEvent | null {
  const base64Data = log.replace("Program data: ", "");

  const parseTrial = tryIt(() => program.coder.events.decode(base64Data));
  if (!parseTrial.success || !parseTrial.data) {
    logger.error("Failed to decode event", { base64Data });
    return null;
  }

  // use `SmartContractEvent` schema and also stringify the fields (they may contain PublicKey and BN) recursively
  const event = {
    eventName: parseTrial.data.name,
    data: JSON.parse(JSON.stringify(parseTrial.data.data)),
  } as SmartContractEvent;

  return event;
}
