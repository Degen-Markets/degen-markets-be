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
import NotificationsService from "../../notifications/NotificationsService";

const BET_CREATED_TOPIC =
  "0xd99412f51ed34f3813c2b4286a0051ba4538cba43788114d8ea0dd6c427663fb";

const betCreatedHandler = async (event: APIGatewayEvent) => {
  const sqs = new SQS();
  const logger = new Logger({
    serviceName: "BetCreatedHandler",
  });
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

  // const notificationsService = new NotificationsService();
  // try {
  //   await Promise.all(
  //     bets.map((bet) =>
  //       notificationsService.sendTelegramMessage(
  //         `New Bet Created: https://degenmarkets.com/bets/${bet.id}`,
  //       ),
  //     ),
  //   );
  // } catch (e) {
  //   logger.error("Error sending create bet tg messages", e as Error);
  // }
  return 200;
};

export default betCreatedHandler;
