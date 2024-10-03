import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEventData } from "../types";
import PoolOptionsService from "../../poolOptions/service";

const logger = new Logger({
  serviceName: "WinnerSetEventHandler",
});

const winnerSetEventHandler = async (
  eventData: SmartContractEventData<"winnerSet">,
) => {
  logger.info("Received WinnerSet event", { eventData });

  const { option } = eventData;
  await PoolOptionsService.setWinner(option);

  logger.info("Completed processing WinnerSet event", { eventData });
};

export default winnerSetEventHandler;
