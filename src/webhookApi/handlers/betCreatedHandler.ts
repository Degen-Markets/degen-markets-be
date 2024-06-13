import { APIGatewayEvent } from "aws-lambda";
import {
  BetCreatedContractEvent,
  BetCreatedSqsEvent,
  BetCreatedWebhookEvent,
} from "../types/BetCreatedTypes";
import { decodeEventLog, zeroAddress } from "viem";
import DEGEN_BETS_V2_ABI from "../../../resources/abi/DegenBetsV2Abi.json";
import { Logger } from "@aws-lambda-powertools/logger";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";
import { sendTelegramMessage } from "../../notifications/telegram";
import { sendTweet } from "../../notifications/twitter";

const BET_CREATED_TOPIC =
  "0x9a0204d7d0a90e95e52d820bb9bd7713c5dc79105b86cfe6073c827a88b999bb";

const betCreatedHandler = async (event: APIGatewayEvent) => {
  const logger = new Logger({
    serviceName: "BetCreatedHandler",
  });
  const queryParams = event.queryStringParameters;
  const chain = queryParams?.chain;
  logger.info(`Creating bet on chain ${chain}`);
  const sqs = new SQS();
  logger.info(`received BetCreated event: ${event.body}`);
  const betCreatedEvent = JSON.parse(
    event.body || "{}",
  ) as BetCreatedWebhookEvent;

  const bets = betCreatedEvent.event.data.block.logs.map((log) => {
    const args = decodeEventLog({
      abi: DEGEN_BETS_V2_ABI,
      data: log.data,
      eventName: "BetCreated",
      strict: true,
      topics: [BET_CREATED_TOPIC],
    }).args as unknown as BetCreatedContractEvent;
    return {
      ...args,
      chain,
      creator: log.transaction.from.address,
      creationTimestamp: Number(args.creationTimestamp.toString()),
      expirationTimestamp: Number(args.expirationTimestamp.toString()),
      value: Number(
        args.currency === zeroAddress
          ? log.transaction.value
          : args.value.toString(),
      ),
    } as BetCreatedSqsEvent;
  });
  try {
    const messageGroupId = getMandatoryEnvVariable("MESSAGE_GROUP_ID");
    const queueUrl = getMandatoryEnvVariable("QUEUE_URL");
    logger.info(
      `sending message to ${queueUrl} with message group id ${messageGroupId}`,
    );
    await sqs.sendMessage({
      MessageBody: JSON.stringify({
        eventName: "BetCreated",
        bets,
      }),
      QueueUrl: queueUrl,
      MessageGroupId: getMandatoryEnvVariable("MESSAGE_GROUP_ID"),
      MessageDeduplicationId: betCreatedEvent.event.data.block.hash,
    });
  } catch (e) {
    logger.error((e as Error).message, e as Error);
  }

  const notificationMessage = `New Bet(s) Created:\n\n${bets
    .map((bet) => `https://degenmarkets.com/bets/${bet.id}`)
    .join("\n")}`;

  try {
    await sendTelegramMessage(notificationMessage);
  } catch (e) {
    logger.error("Error sending create bet tg messages", e as Error);
  }

  try {
    await sendTweet(notificationMessage);
  } catch (e) {
    logger.error("Error sending create bet tweet", e as Error);
  }
  return 200;
};

export default betCreatedHandler;
