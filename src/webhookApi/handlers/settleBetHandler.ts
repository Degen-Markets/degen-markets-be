import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeEventLog } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { APIGatewayEvent } from "aws-lambda";
import {
  SettleBetContractEvent,
  SettleBetSqsEvent,
  SettleBetWebhookEvent,
} from "../types/SettleBetTypes";

const BET_SETTLED_TOPIC =
  "0x77cac40fe703601c1be96bb29a3814c2e320bcd347584de571cc2d2d6028ca11";

const settleBetHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "SettleBetHandler",
  });
  logger.info(`received settle bet event: ${event.body}`);
  const settleBetEvent = JSON.parse(
    event.body || "{}",
  ) as SettleBetWebhookEvent;

  const bets = settleBetEvent.event.data.block.logs.map((log) => {
    const args = decodeEventLog({
      abi: DEGEN_BETS_ABI,
      data: log.data,
      eventName: "BetSettled",
      strict: true,
      topics: [BET_SETTLED_TOPIC],
    }).args as unknown as SettleBetContractEvent;
    return {
      id: args.id,
      winner: args.winner,
      winTimestamp: settleBetEvent.event.data.block.timestamp,
    } as SettleBetSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    logger.info(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetSettled",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: settleBetEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default settleBetHandler;
