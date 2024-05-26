import { APIGatewayEvent } from "aws-lambda";
import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeEventLog } from "viem";
import DEGEN_BETS_V2_ABI from "../../../resources/abi/DegenBetsV2Abi.json";
import {
  BetWithdrawnContractEvent,
  BetWithdrawnSqsEvent,
  BetWithdrawnWebhookEvent,
} from "../types/BetWithdrawnTypes";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";

const BET_WITHDRAWN_TOPIC =
  "0x884ef261d5843d2b240c6b117de1a07002bc87b59f6a69562a3dab30bd764c4e";

const betWithdrawnHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "BetWithdrawnHandler",
  });
  logger.info(`received bet withdrawn event: ${event.body}`);
  const betWithdrawnWebhookEvent = JSON.parse(
    event.body || "{}",
  ) as BetWithdrawnWebhookEvent;
  const bets = betWithdrawnWebhookEvent.event.data.block.logs.map((log) => {
    const args = decodeEventLog({
      abi: DEGEN_BETS_V2_ABI,
      data: log.data,
      eventName: "BetWithdrawn",
      strict: true,
      topics: [BET_WITHDRAWN_TOPIC],
    }).args as unknown as BetWithdrawnContractEvent;
    return {
      id: args.id,
      withdrawalTimestamp: betWithdrawnWebhookEvent.event.data.block.timestamp,
      txHash: log.transaction.hash,
    } as BetWithdrawnSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    logger.info(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetWithdrawn",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: betWithdrawnWebhookEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default betWithdrawnHandler;
