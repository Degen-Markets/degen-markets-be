import { SmartContractEventData } from "../types";
import { Logger } from "@aws-lambda-powertools/logger";
import PoolOptionsService from "../../poolOptions/service";

const logger = new Logger({
  serviceName: "OptionCreatedEventHandler",
});

const optionCreatedEventHandler = async (
  eventData: SmartContractEventData<"optionCreated">,
) => {
  logger.info(`Received OptionCreated event`, { eventData });
  await PoolOptionsService.createNewOption({
    address: eventData.option,
    pool: eventData.poolAccount,
    title: eventData.title,
  });
  logger.info(`Completed processing OptionCreated event`, { eventData });
};

export default optionCreatedEventHandler;
