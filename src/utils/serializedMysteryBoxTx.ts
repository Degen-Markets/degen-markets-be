import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { ActionPostResponse, createPostResponse } from "@solana/actions";
import { connection, program } from "../clients/SolanaProgramClient";
import { ADMIN_PUBKEY } from "../clientApi/constants";
import { PRICE_PER_BOX } from "../solanaActions/generateMysteryBoxPurchaseTx";
import { LAMPORTS_PER_SOL_BIGINT } from "./constants";
import { formatSolBalance } from "./solana";

const AUTHORITY_WALLET = new PublicKey(ADMIN_PUBKEY);

export const _Utils = {
  async serializeMysteryBoxPurchaseTx({
    amountLamports,
    buyer,
  }: {
    amountLamports: bigint;
    buyer: PublicKey;
  }): Promise<ActionPostResponse> {
    const count =
      Number(amountLamports) / Number(LAMPORTS_PER_SOL_BIGINT) / PRICE_PER_BOX;

    const amountBN = new anchor.BN(amountLamports.toString());

    const transaction = await program.methods
      .executeTransfer(amountBN)
      .accountsStrict({
        sender: buyer,
        systemProgram: anchor.web3.SystemProgram.programId,
        receiver: AUTHORITY_WALLET,
      })
      .transaction();

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
