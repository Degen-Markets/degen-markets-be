import { PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  Action,
  ActionPostResponse,
  ActionsJson,
  createPostResponse,
} from "@solana/actions";
import { connection } from "../clients/SolanaProgramClient";
import { ADMIN_PUBKEY } from "../clientApi/constants";
import {
  convertSolToLamports,
  formatSolBalance,
  LAMPORTS_PER_SOL_BIGINT,
} from "../../lib/utils";
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
    const count =
      Number(amountLamports) / Number(LAMPORTS_PER_SOL_BIGINT) / PRICE_PER_BOX;

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

    // TODO: listen to SOL transfer event and create Boxes here

    return createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Purchase Mystery Box for ${displayAmount} SOL`,
        links: {
          next: {
            type: "inline",
            action: {
              label: "",
              type: "action",
              icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
              title: "Open Box #1",
              description: `Successfully Purchased ${count} mystery box for ${displayAmount} SOL!`,
              links: {
                actions: [
                  {
                    type: "transaction",
                    href: `/mystery-boxes/open?boxCount=${count}`,
                    label: "Next",
                  },
                ],
              },
            },
          },
        },
      },
    });
  },
};
