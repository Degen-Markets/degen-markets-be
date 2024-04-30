import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeEventLog } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { APIGatewayEvent } from "aws-lambda";
import {
  WithdrawBetContractEvent,
  WithdrawBetSqsEvent,
  WithdrawBetWebhookEvent,
} from "../types/WithdrawBetTypes";

const BET_WITHDRAWN_TOPIC =
  "0x884ef261d5843d2b240c6b117de1a07002bc87b59f6a69562a3dab30bd764c4e";

const withdrawBetHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "WithdrawBetHandler",
  });
  logger.info(`received withdraw bet event: ${event.body}`);
  const withdrawBetEvent = JSON.parse(
    event.body || "{}",
  ) as WithdrawBetWebhookEvent;

  const bets = withdrawBetEvent.event.data.block.logs.map((log) => {
    const args = decodeEventLog({
      abi: DEGEN_BETS_ABI,
      data: log.data,
      eventName: "BetWithdrawn",
      strict: true,
      topics: [BET_WITHDRAWN_TOPIC],
    }).args as unknown as WithdrawBetContractEvent;
    return {
      id: args.id,
      withdrawalTimestamp: withdrawBetEvent.event.data.block.timestamp,
    } as WithdrawBetSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    console.log(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetWithdrawn",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: withdrawBetEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default withdrawBetHandler;
