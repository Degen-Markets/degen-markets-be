import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEvent } from "../types";
import PoolsService from "../../pools/service";

type PoolCreatedEventData = Extract<
  SmartContractEvent,
  { eventName: "poolCreated" }
>["data"];

const logger = new Logger({
  serviceName: "PoolCreatedEventHandler",
});

const poolCreatedEventHandler = async (eventData: PoolCreatedEventData) => {
  logger.info(`Received PoolCreated event`, { eventData });
  await PoolsService.createNewPool({
    address: eventData.poolAccount,
    title: eventData.title,
    image: eventData.imageUrl,
    description: eventData.description,
  });
  logger.info(`Completed processing PoolCreated event`, { eventData });
};

export default poolCreatedEventHandler;
