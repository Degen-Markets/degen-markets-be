import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEvent } from "../types";
import PoolOptionsService from "../../poolOptions/service";

type WinnerSetEventData = Extract<
  SmartContractEvent,
  { eventName: "winnerSet" }
>["data"];

const logger = new Logger({
  serviceName: "WinnerSetEventHandler",
});

const winnerSetEventHandler = async (eventData: WinnerSetEventData) => {
  logger.info("Received WinnerSet event", { eventData });

  const { pool, option } = eventData;
  await PoolOptionsService.setWinner(option);

  logger.info("Completed processing WinnerSet event", { eventData });
};

export default winnerSetEventHandler;
