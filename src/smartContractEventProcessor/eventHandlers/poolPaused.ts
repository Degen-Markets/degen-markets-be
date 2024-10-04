import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEventData } from "../types";
import PoolsService from "../../pools/service";

const logger = new Logger({
  serviceName: "poolStatusUpdatedEventHandler",
});

const poolPausedEventHandler = async (
  poolPausedEventData: SmartContractEventData<"poolStatusUpdated">,
) => {
  logger.info(`Processing: ${poolPausedEventData}`);
  const { isPaused, pool } = poolPausedEventData;

  const result = await PoolsService.pausePool(isPaused, pool);

  logger.info("Processing PoolPaused event completed", {
    poolAddress: result.address,
  });
};

export default poolPausedEventHandler;
