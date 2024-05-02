import { APIGatewayEvent } from "aws-lambda";
import {
  CreateBetContractEvent,
  CreateBetSqsEvent,
  CreateBetWebhookEvent,
} from "../types/CreateBetTypes";
import { decodeEventLog, zeroAddress } from "viem";
import DEGEN_BETS_ABI from "../../../resources/abi/DegenBetsAbi.json";
import { Logger } from "@aws-lambda-powertools/logger";
import { SQS } from "@aws-sdk/client-sqs";
import { getMandatoryEnvVariable } from "../../utils/getMandatoryEnvValue";

const BET_CREATED_TOPIC =
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
      topics: [BET_CREATED_TOPIC],
    }).args as unknown as CreateBetContractEvent;
    return {
      ...args,
      creationTimestamp: Number(args.creationTimestamp.toString()),
      expirationTimestamp: Number(args.expirationTimestamp.toString()),
      value: Number(
        args.currency === zeroAddress
          ? log.transaction.value
          : args.value.toString(),
      ),
    } as CreateBetSqsEvent;
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
      MessageDeduplicationId: createBetEvent.event.data.block.hash,
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

export default createBetHandler;
