import { PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { ActionPostResponse, createPostResponse } from "@solana/actions";
import { connection } from "../clients/SolanaProgramClient";
import { ADMIN_PUBKEY } from "../clientApi/constants";
import { convertSolToLamports, formatSolBalance } from "../../lib/utils";

const AUTHORITY_WALLET = new PublicKey(ADMIN_PUBKEY);
const PRICE_PER_BOX = 0.02;

export const _Utils = {
  async serializeMysteryBoxPurchaseTx({
    amountInSol,
    account,
  }: {
    amountInSol: string;
    account: string;
  }): Promise<ActionPostResponse> {
    const amountLamports = convertSolToLamports(amountInSol);
    if (!amountLamports) {
      throw new Error("Invalid amount format. Please provide a valid number.");
    }

    if (amountLamports <= 0n) {
      throw new Error("Amount must be greater than 0 SOL");
    }

    const count = Number(amountInSol) / PRICE_PER_BOX;
    const buyer = new PublicKey(account);
    const balance = await connection.getBalance(buyer);
    const balanceBigInt = BigInt(balance);

    if (balanceBigInt < amountLamports) {
      throw new Error(
        `Insufficient balance! Required: ${formatSolBalance(amountLamports)}, Available: ${formatSolBalance(balanceBigInt)}`,
      );
    }

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
