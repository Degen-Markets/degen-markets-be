import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeEventLog } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { APIGatewayEvent } from "aws-lambda";
import {
  AcceptBetContractEvent,
  AcceptBetSqsEvent,
  AcceptBetWebhookEvent,
} from "../types/AcceptBetTypes";

const BET_ACCEPTED_TOPIC =
  "0x4c46eda80d7fbf5e1590d2b15e357a3f95a6ad2634b453013e4dad9d726ddc9c";

const acceptBetHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "AcceptBetHandler",
  });
  logger.info(`received accept bet event: ${event.body}`);
  const acceptBetEvent = JSON.parse(
    event.body || "{}",
  ) as AcceptBetWebhookEvent;

  const bets = acceptBetEvent.event.data.block.logs.map((log) => {
    const eventLog = decodeEventLog({
      abi: DEGEN_BETS_ABI,
      data: log.data,
      eventName: "BetAccepted",
      strict: true,
      topics: [BET_ACCEPTED_TOPIC],
    });
    return {
      id: (eventLog.args as unknown as AcceptBetContractEvent).id,
      acceptor: log.transaction.from.address,
      acceptanceTimestamp: Number(acceptBetEvent.event.data.block.timestamp),
    } as AcceptBetSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    logger.info(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetAccepted",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: acceptBetEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }
  return 200;
};

export default acceptBetHandler;
