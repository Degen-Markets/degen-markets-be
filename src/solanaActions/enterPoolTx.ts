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
import { connection, program } from "./constants";
import { buildBadRequestError } from "../utils/httpResponses";
import { deriveEntryAccountKey } from "../poolEntries/utils";

const logger: Logger = new Logger({ serviceName: "enterPoolService" });

export const generateEnterPoolTx = async (event: APIGatewayProxyEventV2) => {
  logger.info("generating enter pool tx");
  const { account } = JSON.parse(event.body || "{}");
  if (!account) {
    return buildBadRequestError("No account!");
  }
  const entrant = new PublicKey(account);

  if (!PublicKey.isOnCurve(entrant)) {
    return buildBadRequestError("Invalid address!");
  }

  const queryStringParameters = event.queryStringParameters;
  const poolAccountPubkey = new PublicKey(event.pathParameters?.poolId || "");
  const optionAccountPubkey = new PublicKey(
    event.pathParameters?.optionId || "",
  );
  const valueInLamports = queryStringParameters?.value
    ? Number(queryStringParameters?.value) * LAMPORTS_PER_SOL
    : LAMPORTS_PER_SOL;
  const value = new BN(valueInLamports);

  const entryAccountPubkey = deriveEntryAccountKey(
    optionAccountPubkey,
    entrant,
  );

  logger.info(
    JSON.stringify(
      {
        entrant,
        entryAccount: entryAccountPubkey.toString(),
        optionAccount: optionAccountPubkey.toString(),
        poolAccount: poolAccountPubkey.toString(),
      },
      null,
      2,
    ),
  );

  const transaction = await program.methods
    .enterPool(value)
    .accountsPartial({
      entryAccount: entryAccountPubkey,
      optionAccount: optionAccountPubkey,
      poolAccount: poolAccountPubkey,
      entrant: entrant,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();

  const block = await connection.getLatestBlockhash();
  transaction.feePayer = entrant;
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
};
