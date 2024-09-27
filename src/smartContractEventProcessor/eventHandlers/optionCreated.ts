import { SmartContractEvent } from "../types";
import { Logger } from "@aws-lambda-powertools/logger";
import PoolOptionsService from "../../poolOptions/service";

type OptionCreatedEventData = Extract<
  SmartContractEvent,
  { eventName: "optionCreated" }
>["data"];

const logger = new Logger({
  serviceName: "OptionCreatedEventHandler",
});

const optionCreatedEventHandler = async (eventData: OptionCreatedEventData) => {
  logger.info(`Received OptionCreated event`, { eventData });
  await PoolOptionsService.createNewOption({
    address: eventData.option,
    pool: eventData.poolAccount,
    title: eventData.title,
  });
  logger.info(`Completed processing OptionCreated event`, { eventData });
};

export default optionCreatedEventHandler;
