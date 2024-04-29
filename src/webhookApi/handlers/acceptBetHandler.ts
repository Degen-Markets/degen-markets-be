import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  CreateBetContractEvent,
  CreateBetSqsEvent,
  CreateBetWebhookEvent,
} from "../types/CreateBetTypes";
import { decodeEventLog } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { CREATE_BET_TOPIC } from "./createBetHandler";
import { APIGatewayEvent } from "aws-lambda";

const acceptBetHandler = async (event: APIGatewayEvent) => {
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
    } as CreateBetSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    console.log(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetCreated",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: createBetEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default acceptBetHandler;
