import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEventData } from "../types";
import PoolOptionsService from "../../poolOptions/service";
import PoolEntriesService from "../../poolEntries/service";

const logger = new Logger({
  serviceName: "WinClaimedEventHandler",
});

const winClaimedEventHandler = async (
  eventData: SmartContractEventData<"winClaimed">,
) => {
  logger.info("Received WinClaimed event", { eventData });

  const { entry } = eventData;
  await PoolEntriesService.claimWin(entry);

  logger.info("Completed processing WinClaimed event", { eventData });
};

export default winClaimedEventHandler;
