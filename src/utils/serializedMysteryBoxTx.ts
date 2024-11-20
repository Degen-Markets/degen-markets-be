import { PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { ActionPostResponse, createPostResponse } from "@solana/actions";
import { connection } from "../clients/SolanaProgramClient";
import { ADMIN_PUBKEY } from "../clientApi/constants";
import { convertSolToLamports, formatSolBalance } from "../../lib/utils";
import { PRICE_PER_BOX } from "../solanaActions/generateMysteryBoxPurchaseTx";
import { Logger } from "@aws-lambda-powertools/logger";

const AUTHORITY_WALLET = new PublicKey(ADMIN_PUBKEY);

export const _Utils = {
  async serializeMysteryBoxPurchaseTx({
    amountLamports,
    account,
    buyer,
  }: {
    amountLamports: bigint;
    account: string;
    buyer: PublicKey;
  }): Promise<ActionPostResponse> {
    const count = Number(amountLamports) / PRICE_PER_BOX;

    const transferInstruction = anchor.web3.SystemProgram.transfer({
      fromPubkey: buyer,
      toPubkey: AUTHORITY_WALLET,
      lamports: amountLamports,
    });

    const transaction = new Transaction();
    transaction.add(transferInstruction);

    const block = await connection.getLatestBlockhash();
    transaction.feePayer = buyer;
    transaction.recentBlockhash = block.blockhash;

    const displayAmount = formatSolBalance(amountLamports, false);

    return createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Purchase Mystery Box for ${displayAmount} SOL`,
        links: {
          next: {
            type: "inline",
            action: {
              type: "completed",
              label: "Mystery Box Purchased!",
              title: "Mystery Box Purchase completed",
              description: `Successfully Purchased ${count} mystery box for ${displayAmount} SOL!`,
              icon: "",
            },
          },
        },
      },
    });
  },
};
