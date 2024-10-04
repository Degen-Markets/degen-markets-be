import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEventData } from "../types";
import PoolsService from "../../pools/service";

const logger = new Logger({
  serviceName: "poolStatusUpdatedEventHandler",
});

const poolStatusUpdatedEventHandler = async (
  eventData: SmartContractEventData<"poolStatusUpdated">,
) => {
  logger.info(`Processing: ${eventData}`);
  const { isPaused, pool } = eventData;

  const result = await PoolsService.setIsPausedPool(isPaused, pool);

  logger.info("Processing PoolStatusUpdated event completed", {
    poolAddress: result.address,
  });
};

export default poolStatusUpdatedEventHandler;
