import {
  SmartContractEvent,
  parseSmartContractEventFromDecodedEvent,
} from "./types";

namespace SmartContractEventProcessor_utils {
  /**
   * Parses a stringified event into a SmartContractEvent.
   * @param eventString A JSON string representing the event.
   * @returns A parsed SmartContractEvent.
   * @throws Will throw an error if the input is not valid JSON or doesn't match the expected format.
   */
  export function parseSmartContractEvent(
    eventString: string,
  ): SmartContractEvent {
    const parsedEvent = JSON.parse(eventString);

    if (
      typeof parsedEvent !== "object" ||
      parsedEvent === null ||
      !("name" in parsedEvent) ||
      !("data" in parsedEvent)
    ) {
      throw new Error(
        'Invalid event format: expected an object with "name" and "data" properties',
      );
    }

    return parseSmartContractEventFromDecodedEvent(parsedEvent);
  }
}

export default SmartContractEventProcessor_utils;
