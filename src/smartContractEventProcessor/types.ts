import { BN, IdlEvents } from "@coral-xyz/anchor";
import { program } from "../solanaActions/constants";
import { PublicKey } from "@solana/web3.js";
import { typedIncludes } from "../utils/typedStdLib";

/** the following are intermediary types for generating {@link SmartContractEvent} */

type EventsRecord = IdlEvents<typeof program.idl>;
type EventName = keyof EventsRecord;
type ConvertToString<T> = T extends PublicKey | BN ? string : T;

type RecursivelyConvertToString<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: RecursivelyConvertToString<T[K]>;
      }
    : ConvertToString<T>;

// this is basically the stringified version of the anchor event
export type SmartContractEvent = {
  [K in EventName]: {
    eventName: K;
    data: RecursivelyConvertToString<EventsRecord[K]>;
  };
}[EventName];

/**
 * Converts native IDL events to our custom {@link SmartContractEvent} type.
 * @param event - The decoded event object containing name and data properties.
 * @param event.name - The name of the event.
 * @param event.data - The data associated with the event.
 * @returns {SmartContractEvent} A parsed SmartContractEvent object.
 * @throws {Error} If the event name is invalid, the event type is unknown, or required fields are missing.
 */
export function parseSmartContractEventFromDecodedEvent(event: {
  name: string;
  data: any;
}): SmartContractEvent {
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

  /** Convert the event to {@link SmartContractEvent} type */
  const convertedData: SmartContractEvent["data"] = JSON.parse(
    JSON.stringify(event.data),
  );

  return {
    eventName: event.name,
    data: convertedData,
  } as SmartContractEvent;
}
