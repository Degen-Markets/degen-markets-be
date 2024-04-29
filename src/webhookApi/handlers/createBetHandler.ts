import { APIGatewayEvent } from "aws-lambda";
import {
  CreateBetWebhookEvent,
  CreateBetContractEvent,
  CreateBetSqsBody,
} from "../types/CreateBetTypes";
import { decodeEventLog } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { Logger } from "@aws-lambda-powertools/logger";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";

export const CREATE_BET_TOPIC =
  "0x807e743b9b5ddc6f51022646b7a8cae5649afbf10bd3d28a5c11a74a9916e651";

const createBetHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "CreateBetHandler",
  });
  logger.info(`received create bet event: ${event.body}`);
  const createBetEvent = JSON.parse(
    event.body || "{}",
  ) as CreateBetWebhookEvent;

  const bets = createBetEvent.event.data.block.logs.map((log) => {
    const args = decodeEventLog({
      abi: DEGEN_BETS_ABI,
      data: log.data,
      eventName: "BetCreated",
      strict: true,
      topics: [CREATE_BET_TOPIC],
    }).args as unknown as CreateBetContractEvent;
    return {
      ...args,
      creationTimestamp: args.creationTimestamp.toString(),
      duration: args.duration.toString(),
      value: args.value.toString(),
    } as CreateBetSqsBody;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    console.log(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify(bets),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: createBetEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default createBetHandler;
