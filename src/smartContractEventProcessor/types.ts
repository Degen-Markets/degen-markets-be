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
  // check if event name is valid
  const eventName = event.name;
  const allEventNames = program.idl.events.map((e) => e.name);
  if (!typedIncludes(allEventNames, eventName)) {
    throw new Error(`Invalid event name: ${eventName}`);
  }

  // check if event data is valid
  const eventType = program.idl.types.find((type) => type.name === eventName);
  if (!eventType || eventType.type.kind !== "struct") {
    throw new Error(`Event ${eventName} type doesn't exist`);
  }
  const eventDataFields = eventType.type.fields.map((field) => field.name);
  if (
    !(
      typeof event.data === "object" &&
      event.data !== null &&
      // We haven't checked for the type of data stored in each event.data field, as it is much more intensive to check.
      // This can be added in future if required.
      eventDataFields.every((field) => event.data.hasOwnProperty(field))
    )
  ) {
    throw new Error(`Invalid event data: ${JSON.stringify(event.data)}`);
  }

  /** Convert the event to {@link SmartContractEvent} type */
  const convertedData: SmartContractEvent["data"] = JSON.parse(
    JSON.stringify(event.data),
  );

  return {
    eventName,
    data: convertedData,
  } as SmartContractEvent;
}
