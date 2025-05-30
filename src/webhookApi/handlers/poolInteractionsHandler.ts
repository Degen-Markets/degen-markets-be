import { Logger } from "@aws-lambda-powertools/logger";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../utils/httpResponses";
import { tryIt, tryItAsync } from "../../utils/tryIt";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { SmartContractEvent } from "../../smartContractEventProcessor/types";
import { decodeEventBase64Data } from "../../smartContractEventProcessor/utils";

const logger = new Logger({
  serviceName: "PoolInteractionsHandler",
});

export const poolInteractionsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Received event", { event: event.body });
  const parseTrial = tryIt(() => JSON.parse(String(event.body)));
  if (!parseTrial.success) {
    logger.error("Invalid event body", {
      error: parseTrial.err,
      body: event.body,
    });
    return buildBadRequestError("Missing or invalid event body");
  }
  const parsedBody = parseTrial.data;

  const blockTime = parsedBody[0].blockTime;

  if (!blockTime) {
    logger.error(
      "blockTime is missing from event body. Terminating processing.",
    );
    return buildBadRequestError("blockTime is required but missing.");
  }

  const timestamp = new Date(blockTime * 1000).toISOString(); // Convert blockTime to a string in ISO format

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
    .map((log) => mapLogToEventOrNull(log, timestamp))
    .filter((event) => event !== null) as SmartContractEvent[]; // `.filter` doesn't narrow the type apparently (https://stackoverflow.com/a/63541957)

  const sqs = new SQS();
  const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
  const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");

  const sendMessagePromises = smartContractEvents.map(async (event) => {
    const result = await tryItAsync(async () => {
      logger.info("Sending SQS Event", { event });
      const messageBody = JSON.stringify(event);
      await sqs.sendMessage({
        MessageBody: messageBody,
        QueueUrl: queueUrl,
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: `${event.eventName}-${Date.now()}`,
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

function mapLogToEventOrNull(
  log: string,
  timestamp: string,
): SmartContractEvent | null {
  const base64Data = log.replace("Program data: ", "");

  const parseTrial = tryIt(() => decodeEventBase64Data(base64Data));
  if (!parseTrial.success || !parseTrial.data) {
    logger.error("Failed to decode event", {
      base64Data,
      ...(!parseTrial.success ? { err: parseTrial.err } : {}),
    });
    return null;
  }
  logger.info("Decoded event: ", { decodedEvent: parseTrial.data });

  const event = parseTrial.data;
  switch (event.name) {
    case "poolEntered":
      return {
        eventName: event.name,
        timestamp,
        data: {
          pool: event.data.pool.toString(),
          option: event.data.option.toString(),
          entry: event.data.entry.toString(),
          value: event.data.value.toString(),
          entrant: event.data.entrant.toString(),
        },
      };

    case "poolCreated":
      return {
        eventName: event.name,
        timestamp,
        data: {
          poolAccount: event.data.poolAccount.toString(),
          title: event.data.title,
          imageUrl: event.data.imageUrl,
          description: event.data.description,
        },
      };

    case "optionCreated":
      return {
        eventName: event.name,
        timestamp,
        data: {
          poolAccount: event.data.poolAccount.toString(),
          option: event.data.option.toString(),
          title: event.data.title,
        },
      };

    case "winnerSet":
      return {
        eventName: event.name,
        timestamp,
        data: {
          pool: event.data.pool.toString(),
          option: event.data.option.toString(),
        },
      };

    case "poolStatusUpdated":
      return {
        eventName: event.name,
        timestamp,
        data: {
          isPaused: event.data.isPaused,
          pool: event.data.pool.toString(),
        },
      };

    default:
      // null means event isn't recognized, or we don't care about this event in backend webhook flow
      return null;
  }
}
