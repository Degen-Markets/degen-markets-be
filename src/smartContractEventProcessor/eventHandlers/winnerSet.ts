import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEvent } from "../types";

type WinnerSetEventData = Extract<
  SmartContractEvent,
  { eventName: "winnerSet" }
>["data"];

const logger = new Logger({
  serviceName: "WinnerSetEventHandler",
});

const winnerSetEventHandler = async (eventData: WinnerSetEventData) => {
  logger.info("Processing WinnerSet event", { eventData });
};

export default winnerSetEventHandler;
