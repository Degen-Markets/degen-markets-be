import { APIGatewayProxyEventV2 } from "aws-lambda";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import BN from "bn.js";
import * as anchor from "@coral-xyz/anchor";
import {
  buildBadRequestError,
  buildInternalServerError,
} from "../utils/httpResponses";
import { deriveEntryAccountKey } from "../poolEntries/utils";
import { connection, program } from "../clients/SolanaProgramClient";
import { sendSlackNotification } from "../utils/slackNotifier";

const logger: Logger = new Logger({ serviceName: "enterPoolService" });

export const generateEnterPoolTx = async (event: APIGatewayProxyEventV2) => {
  try {
    const poolId = event.pathParameters?.poolId;
    const optionId = event.pathParameters?.optionId;
    const { account } = JSON.parse(event.body || "{}");
    const value = event.queryStringParameters?.value;

    if (!poolId || !optionId || !account || !value) {
      const error = "Missing required parameters";
      logger.error(error, { poolId, optionId, account, value });

      await sendSlackNotification({
        type: "error",
        title: "Solana (enterPoolTx): Missing Required Parameters",
        details: {
          error,
          poolId,
          optionId,
          account,
          value,
        },
      });

      return buildBadRequestError("Missing required parameters");
    }

    logger.info("Generating enter pool tx", {
      poolId,
      optionId,
      account,
      value,
    });

    const poolKey = new PublicKey(poolId);
    const optionKey = new PublicKey(optionId);
    const userKey = new PublicKey(account);

    const entryKey = await deriveEntryAccountKey(optionKey, userKey);

    const entryAccount = await connection.getAccountInfo(entryKey);

    if (entryAccount) {
      const error = "You have already entered this pool!";
      logger.error(error, { entryKey: entryKey.toString() });

      await sendSlackNotification({
        type: "error",
        title: "Solana (enterPoolTx): Pool Entry Already Exists",
        details: {
          error,
          poolId,
          optionId,
          account,
          entryKey: entryKey.toString(),
        },
      });

      return buildBadRequestError("You have already entered this pool!");
    }

    const valueBn = new BN(Number(value) * LAMPORTS_PER_SOL);

    logger.info(
      JSON.stringify(
        {
          entryAccount: entryKey.toString(),
          optionAccount: optionKey.toString(),
          poolAccount: poolKey.toString(),
          entrant: userKey.toString(),
        },
        null,
        2,
      ),
    );
    const transaction = await program.methods
      .enterPool(valueBn)
      .accountsPartial({
        entryAccount: entryKey,
        optionAccount: optionKey,
        poolAccount: poolKey,
        entrant: userKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction();

    const block = await connection.getLatestBlockhash();
    transaction.feePayer = userKey;
    transaction.recentBlockhash = block.blockhash;
    logger.info(JSON.stringify(transaction));
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
      },
    });

    logger.info(JSON.stringify(payload));

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: ACTIONS_CORS_HEADERS,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to generate enter pool transaction", {
      error: errorMessage,
    });

    await sendSlackNotification({
      type: "error",
      title: "Solana (enterPoolTx): Enter Pool Transaction Failed",
      details: {
        error: errorMessage,
      },
    });

    return buildInternalServerError(errorMessage);
  }
};
