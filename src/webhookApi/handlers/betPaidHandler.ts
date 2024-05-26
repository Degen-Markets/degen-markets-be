import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayEvent } from "aws-lambda";
import DEGEN_BETS_V2_ABI from "../../../resources/abi/DegenBetsV2Abi.json";
import { SQS } from "@aws-sdk/client-sqs";
import {
  BetPaidContractEvent,
  BetPaidSqsEvent,
  BetPaidWebhookEvent,
} from "../types/BetPaidTypes";
import { decodeEventLog } from "viem";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";

const BET_PAID_TOPIC =
  "0x5c0a21548aa1b914099d44da75211e1a191895cf247f91eb306de0c7a7864d24";

const betPaidHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "BetPaidHandler",
  });
  logger.info(`received bet paid event: ${event.body}`);
  const betPaidWebhookEvent = JSON.parse(
    event.body || "{}",
  ) as BetPaidWebhookEvent;
  const bets = betPaidWebhookEvent.event.data.block.logs.map((log) => {
    const eventData = decodeEventLog({
      abi: DEGEN_BETS_V2_ABI,
      data: log.data,
      eventName: "BetPaid",
      strict: true,
      topics: [BET_PAID_TOPIC],
    });
    return {
      ...(eventData.args as unknown as BetPaidContractEvent),
      txHash: log.transaction.hash,
    } as BetPaidSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    logger.info(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetPaid",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: betPaidWebhookEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
};
export default betPaidHandler;
