import { Logger } from "@aws-lambda-powertools/logger";
import { IdlEvents } from "@coral-xyz/anchor";
import { program } from "../../solanaActions/constants";
import { buildBadRequestError } from "../../utils/errors";
import { buildOkResponse } from "../../utils/httpResponses";
import { tryIt, tryItAsync } from "../../utils/tryIt";
import { APIGatewayEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { typedIncludes } from "../../utils/typedStdLib";

const EVENTS_TO_SEND = [
  "poolEntered",
] satisfies (typeof program.idl.events)[number]["name"][];

const logger = new Logger({
  serviceName: "PoolInteractionsHandler",
});

export const poolInteractionsHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResultV2> => {
  const parseTrial = tryIt(() => JSON.parse(event.body || ""));
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

  const parsedEvents = programDataLogs
    .map(mapLogToEventOrNull)
    .filter((event) => event !== null);

  const sqs = new SQS();
  const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
  const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
  const concatenatedSignatures = parsedBody[0].signatures.join("-");

  const sendMessagePromises = parsedEvents.map(async (event) => {
    if (!typedIncludes(EVENTS_TO_SEND, event.name)) return;

    const result = await tryItAsync(async () => {
      const messageBody = JSON.stringify(event);
      sqs.sendMessage({
        MessageBody: messageBody,
        QueueUrl: queueUrl,
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: `${event.name}-${concatenatedSignatures}-${Date.now()}`,
      });
    });

    if (!result.success) {
      logger.error(`Failed to send ${event.name} event to SQS`, {
        error: result.err,
        event,
      });
      return;
    }

    logger.info(`Sent ${event.name} event to SQS`, { event });
  });

  await Promise.all(sendMessagePromises);

  return buildOkResponse({ message: "Events processor completed run" });
};

/**
 * Helps us strongly type the events we get from parsing the program data logs.
 */
function parseSmartContractEvent(event: { name: string; data: any }): Event {
  const allEventNames = program.idl.events.map((e) => e.name);
  if (!typedIncludes(allEventNames, event.name)) {
    throw new Error(`Invalid event name: ${event.name}`);
  }

  const eventType = program.idl.types.find((type) => type.name === event.name);
  if (!eventType) {
    throw new Error(`Unknown event type: ${event.name}`);
  }

  if (eventType.type.kind !== "struct") {
    throw new Error(`Event type ${event.name} is not a struct`);
  }

  const requiredFields = eventType.type.fields.map((field) => field.name);
  const missingFields = requiredFields.filter(
    (field) => !(field in event.data),
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields for ${event.name} event: ${missingFields.join(", ")}`,
    );
  }

  // TODO: Make this Event type specific to DGM, not anchor's Event (dependency inversion)
  return event as Event;
}

type EventsRecord = IdlEvents<typeof program.idl>;
type EventName = keyof EventsRecord;
type Event = {
  [K in EventName]: { name: K; data: EventsRecord[K] };
}[EventName];

function mapLogToEventOrNull(log: string): Event | null {
  const base64Data = log.replace("Program data: ", "");

  const parseTrial = tryIt(() => program.coder.events.decode(base64Data));
  if (!parseTrial.success || !parseTrial.data) {
    logger.error("Failed to decode event", { base64Data });
    return null;
  }

  const untypedEvent = parseTrial.data; // temporary alias to allow type narrowing inside `tryIt`
  const strongTypeTrial = tryIt(() => parseSmartContractEvent(untypedEvent));
  if (!strongTypeTrial.success) {
    logger.error("Failed to get strongly typed event", {
      event: untypedEvent,
      err: strongTypeTrial.err,
    });
    return null;
  }
  return strongTypeTrial.data;
}
