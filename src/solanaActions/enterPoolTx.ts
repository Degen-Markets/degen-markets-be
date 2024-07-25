import { APIGatewayEvent } from "aws-lambda";
import { buildBadRequestError } from "../utils/errors";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import BN from "bn.js";
import * as anchor from "@coral-xyz/anchor";
import { connection, program, programId } from "./constants";

const logger: Logger = new Logger({ serviceName: "enterPoolService" });

export const deriveEntryAccountKey = async (
  optionAccountKey: PublicKey,
  entrant: PublicKey,
) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [optionAccountKey.toBuffer(), entrant.toBuffer()],
    programId,
  );
  console.log(`Derived entry account is ${pda}`);
  return pda;
};

export const generateEnterPoolTx = async (event: APIGatewayEvent) => {
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

  const entryAccountPubkey = await deriveEntryAccountKey(
    optionAccountPubkey,
    entrant,
  );

  // Serialize the instruction data
  const instructionData = Buffer.alloc(8);
  instructionData.writeBigUInt64LE(BigInt(value.toString()));

  logger.info(`Data size: ${instructionData.length}, data: ${instructionData}`);

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

  // const transaction = new Transaction().add(
  //   new TransactionInstruction({
  //     keys: [
  //       { pubkey: entryAccountPubkey, isSigner: false, isWritable: true },
  //       { pubkey: optionAccountPubkey, isSigner: false, isWritable: true },
  //       { pubkey: poolAccountPubkey, isSigner: false, isWritable: true },
  //       {
  //         pubkey: entrant,
  //         isSigner: true,
  //         isWritable: true,
  //       },
  //       {
  //         pubkey: SystemProgram.programId,
  //         isSigner: false,
  //         isWritable: false,
  //       },
  //     ],
  //     programId: programId,
  //     data: instructionData,
  //   }),
  // );
  const block = await connection.getLatestBlockhash();
  transaction.feePayer = entrant;
  transaction.recentBlockhash = block.blockhash;

  logger.info(JSON.stringify(transaction));

  const payload: ActionPostResponse = await createPostResponse({
    fields: {
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

// const event = {
//   queryStringParameters: {
//     value: String("1"),
//   },
//   pathParameters: {
//     poolId: "GFjDFXHkCPRj28JLgKnBQMoj3DuyRjL9FfZZowedHUMp",
//     optionId: "6nrV1xXJBMmkph6jG1DTaQaFwiG1wVjgs75Xq9NeVJyC",
//   },
//   body: '{"account":"ABMHApyZu8DfuaGoKoLk4yRHFsvzHwsEsGZXKsJ19FBX"}',
// } as unknown as APIGatewayEvent;
//
// generateEnterPoolTx(event).then(console.log).catch(console.log);
