import { SQS } from "@aws-sdk/client-sqs";
import { Logger } from "@aws-lambda-powertools/logger";
import { decodeEventLog } from "viem";
import DEGEN_BETS_V2_ABI from "../../../resources/abi/DegenBetsV2Abi.json";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { APIGatewayEvent } from "aws-lambda";
import {
  BetAcceptedContractEvent,
  BetAcceptedSqsEvent,
  BetAcceptedWebhookEvent,
} from "../types/BetAcceptedTypes";
import { sendTelegramMessage } from "../../notifications/NotificationsService";

const BET_ACCEPTED_TOPIC =
  "0x85b053dc6ea92023daa993ba2b8798963198248b43277234da5187e757c6ab94";

const betAccepted = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "BetAcceptedHandler",
  });
  logger.info(`received bet accepted event: ${event.body}`);
  const betAcceptedWebhookEvent = JSON.parse(
    event.body || "{}",
  ) as BetAcceptedWebhookEvent;

  const bets = betAcceptedWebhookEvent.event.data.block.logs.map((log) => {
    const eventData = decodeEventLog({
      abi: DEGEN_BETS_V2_ABI,
      data: log.data,
      eventName: "BetAccepted",
      strict: true,
      topics: [BET_ACCEPTED_TOPIC],
    });
    const bet = eventData.args as unknown as BetAcceptedContractEvent;
    return {
      ...bet,
      acceptor: log.transaction.from.address,
      acceptanceTimestamp: Number(
        betAcceptedWebhookEvent.event.data.block.timestamp,
      ),
    } as BetAcceptedSqsEvent;
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
      MessageDeduplicationId: betAcceptedWebhookEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }

  try {
    await Promise.all(
      bets.map((bet) =>
        sendTelegramMessage(
          `Bet Accepted: https://degenmarkets.com/bets/${bet.id}`,
        ),
      ),
    );
  } catch (e) {
    logger.error("Error sending accept bet tg messages", e as Error);
  }
  return 200;
};

export default betAccepted;
