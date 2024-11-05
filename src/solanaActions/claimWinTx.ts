import { PublicKey, Transaction } from "@solana/web3.js";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayProxyResultV2 } from "aws-lambda";
import { deriveEntryAccountKey } from "../poolEntries/utils";
import PoolEntriesService from "../poolEntries/service";
import { connection, program } from "../clients/SolanaProgramClient";

const logger = new Logger({ serviceName: "ClaimWinTx" });

const alreadyClaimedErrorMessage = "You have already claimed this bet!";
const didNotWinMessage = "You did not win this bet!";

export const claimWinTx = async (
  poolAccountKeyString: string,
  optionAccountKeyString: string,
  winnerAccountKeyString: string,
): Promise<APIGatewayProxyResultV2> => {
  logger.info(
    `Trying to claim win for pool ${poolAccountKeyString}, option: ${optionAccountKeyString}, for user: ${winnerAccountKeyString}`,
  );
  const poolAccountKey = new PublicKey(poolAccountKeyString);
  const optionAccountKey = new PublicKey(optionAccountKeyString);
  const winnerAccountKey = new PublicKey(winnerAccountKeyString);
  const entryAccountKey = deriveEntryAccountKey(
    optionAccountKey,
    winnerAccountKey,
  );
  let transaction: Transaction;
  try {
    logger.info(
      `Checking if the user's entry exists with key: ${optionAccountKeyString}`,
    );
    const entry = await PoolEntriesService.getByAddress(
      entryAccountKey.toString(),
    );
    if (!entry) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: didNotWinMessage }),
        headers: ACTIONS_CORS_HEADERS as Record<string, string>,
      };
    }

    if (entry.isClaimed) {
      logger.info("Entry already claimed");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: alreadyClaimedErrorMessage }),
        headers: ACTIONS_CORS_HEADERS as Record<string, string>,
      };
    }
    transaction = await program.methods
      .claimWin()
      .accountsPartial({
        poolAccount: poolAccountKey,
        optionAccount: optionAccountKey,
        entryAccount: entryAccountKey,
        winner: winnerAccountKey,
      })
      .transaction();
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: didNotWinMessage }),
      headers: ACTIONS_CORS_HEADERS as Record<string, string>,
    };
  }

  // serializing transaction
  const block = await connection.getLatestBlockhash();
  transaction.feePayer = winnerAccountKey;
  transaction.recentBlockhash = block.blockhash;
  const payload: ActionPostResponse = await createPostResponse({
    fields: { type: "transaction", transaction },
  });
  logger.info(`Built claim transaction:`, JSON.stringify(payload));
  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS as Record<string, string>,
  };
};
