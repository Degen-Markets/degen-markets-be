import { connection, program } from "../solanaActions/constants";
import { deriveEntryAccountKey } from "../solanaActions/enterPoolTx";
import { PublicKey } from "@solana/web3.js";
import { buildHttpResponse, buildOkResponse } from "../utils/httpResponses";
import { ActionPostResponse, createPostResponse } from "@solana/actions";

export const claimWin = async (
  poolAccountKeyString: string,
  optionAccountKeyString: string,
  winnerAccountKeyString: string,
) => {
  const poolAccountKey = new PublicKey(poolAccountKeyString);
  const optionAccountKey = new PublicKey(optionAccountKeyString);
  const winnerAccountKey = new PublicKey(winnerAccountKeyString);
  const entryAccountKey = deriveEntryAccountKey(
    optionAccountKey,
    winnerAccountKey,
  );
  const transaction = await program.methods
    .claimWin()
    .accountsPartial({
      poolAccount: poolAccountKey,
      optionAccount: optionAccountKey,
      entryAccount: entryAccountKey,
      winner: winnerAccountKey,
    })
    .transaction();
  const block = await connection.getLatestBlockhash();
  transaction.feePayer = winnerAccountKey;
  transaction.recentBlockhash = block.blockhash;
  const payload: ActionPostResponse = await createPostResponse({
    fields: {
      transaction,
    },
  });
  return buildOkResponse({
    signature: payload.transaction,
  });
};
