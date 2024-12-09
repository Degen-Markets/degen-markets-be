import { Logger } from "@aws-lambda-powertools/logger";
import { SmartContractEventData } from "../types";
import MysteryBoxServices from "../../boxes/service";

const logger = new Logger({
  serviceName: "solTransferredEventHandler",
});

const solTransferredEventHandler = async (
  eventData: SmartContractEventData<"solTransferred">,
) => {
  logger.info(`Processing: ${eventData}`);
  const { amount, sender } = eventData;

  const result = await MysteryBoxServices.createBox({
    player: sender,
    isOpened: false,
    createdAt: new Date().toISOString(),
  });

  logger.info("SOL transfer event processed, box created", {
    sender,
    amount,
    boxId: result.id,
  });
};

export default solTransferredEventHandler;
