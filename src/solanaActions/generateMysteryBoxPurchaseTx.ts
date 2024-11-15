import { APIGatewayProxyEventV2 } from "aws-lambda";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Logger } from "@aws-lambda-powertools/logger";
import * as anchor from "@coral-xyz/anchor";
import { ActionPostResponse, createPostResponse } from "@solana/actions";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../utils/httpResponses";

import { connection } from "../clients/SolanaProgramClient";
import { ADMIN_PUBKEY } from "../clientApi/constants";
import { convertSolToLamports, formatSolBalance } from "../../lib/utils";

const logger: Logger = new Logger({
  serviceName: "GenerateMysteryBoxPurchaseTx",
});

const AUTHORITY_WALLET = new PublicKey(ADMIN_PUBKEY);
const PRICE_PER_BOX = 0.02;

const generateMysteryBoxPurchaseTx = async (event: APIGatewayProxyEventV2) => {
  const amountInSol = event.queryStringParameters?.amountInSol;

  const { account } = JSON.parse(event.body || "{}");

  logger.info("Serializing a mystery box purchase tx", {
    amountInSol,
    account,
  });

  if (!amountInSol || !account) {
    logger.error("Invalid amount format!", { amountInSol, account });
    return buildBadRequestError(
      "Invalid amount format. Please provide a valid SOL amount.",
    );
  }

  // Convert amount to lamports
  const amountLamports = convertSolToLamports(amountInSol);

  if (!amountLamports) {
    logger.error("Failed to convert amount to lamports", { amountInSol });
    return buildBadRequestError(
      "Invalid amount format. Please provide a valid number.",
    );
  }

  if (amountLamports <= 0n) {
    logger.error("Amount must be greater than 0", { amountInSol });
    return buildBadRequestError("Amount must be greater than 0 SOL");
  }

  try {
    const buyer = new PublicKey(account);
    const balance = await connection.getBalance(buyer);
    const balanceBigInt = BigInt(balance);

    if (balanceBigInt < amountLamports) {
      logger.error("Insufficient balance", {
        required: formatSolBalance(amountLamports),
        available: formatSolBalance(balanceBigInt),
      });
      return buildBadRequestError(
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

    const count = Number(amountInSol) / PRICE_PER_BOX;

    const payload: ActionPostResponse = await createPostResponse({
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

    logger.info("Mystery Box Purchase transaction serialized successfully", {
      payload,
      buyer: buyer.toString(),
      amountLamports: amountLamports.toString(),
      amountSol: displayAmount,
      authority: AUTHORITY_WALLET.toString(),
    });

    return buildOkResponse(payload);
  } catch (e) {
    logger.error((e as Error).message, { error: e });
    return buildInternalServerError(
      "Failed to generate mystery box purchase transaction. Please try again.",
    );
  }
};

export default generateMysteryBoxPurchaseTx;
