import { connection, program, provider } from "./constants";
import { deriveEntryAccountKey } from "./enterPoolTx";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  ActionError,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayProxyResultV2 } from "aws-lambda";

const logger = new Logger({ serviceName: "ClaimWinTx" });

const alreadyClaimedErrorMessage = "You have already claimed this bet!";

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
    const entryAccount = await program.account.entry.fetch(entryAccountKey); // fetching an
    logger.info(`Found entry Account`, {
      ...entryAccount,
      value: Number(entryAccount.value),
    });
    if (entryAccount.isClaimed) {
      logger.info("Entry already claimed");
      throw new Error(alreadyClaimedErrorMessage);
    } else {
      transaction = await program.methods
        .claimWin()
        .accountsPartial({
          poolAccount: poolAccountKey,
          optionAccount: optionAccountKey,
          entryAccount: entryAccountKey,
          winner: winnerAccountKey,
        })
        .transaction();
    }
  } catch (e) {
    const errMsg = (e as Error).message;
    let errMsgForUsr = "Something went wrong. Try again";
    if (errMsg.includes("Account does not exist or has no data")) {
      logger.info(`User entry not found`);
      errMsgForUsr = "You did not win this bet!";
    }
    if (errMsg === alreadyClaimedErrorMessage) {
      logger.info(`Entry already claimed by user ${winnerAccountKeyString}`);
      errMsgForUsr = alreadyClaimedErrorMessage;
    }
    const actionErr: ActionError = { message: errMsgForUsr };
    return {
      statusCode: 400,
      body: JSON.stringify(actionErr),
      headers: ACTIONS_CORS_HEADERS as Record<string, string>,
    };
  }
  const block = await connection.getLatestBlockhash();
  transaction.feePayer = winnerAccountKey;
  transaction.recentBlockhash = block.blockhash;
  const payload: ActionPostResponse = await createPostResponse({
    fields: { transaction },
  });
  logger.info(JSON.stringify(payload));
  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS as Record<string, string>,
  };
};
