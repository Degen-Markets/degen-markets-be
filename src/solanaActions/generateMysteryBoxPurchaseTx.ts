import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

import { _Utils } from "../utils/serializedMysteryBoxTx";
import { buildBadRequestError } from "../utils/httpResponses";
import { convertSolToLamports, formatSolBalance } from "../../lib/utils";
import { connection } from "../clients/SolanaProgramClient";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
export const PRICE_PER_BOX = 0.02;

const logger: Logger = new Logger({
  serviceName: "GenerateMysteryBoxPurchaseTx",
});

const generateMysteryBoxPurchaseTx = async (event: APIGatewayProxyEventV2) => {
  const amountInSol = event.queryStringParameters?.amountInSol;
  const { account } = JSON.parse(event.body || "{}");

  logger.info("Serializing a mystery box purchase tx", {
    amountInSol,
    account,
  });
  buildBadRequestError;

  if (!account) {
    logger.error("Account missing", { account });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Account address is required to process the transaction.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  if (!amountInSol || isNaN(Number(amountInSol)) || Number(amountInSol) <= 0) {
    logger.error("Invalid amount", { amountInSol });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Invalid amount: ${amountInSol}`,
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  const amountLamports = convertSolToLamports(amountInSol);

  if (!amountLamports) {
    throw new Error("Invalid amount format. Please provide a valid number.");
  }
  const buyer = new PublicKey(account);
  const balance = await connection.getBalance(buyer);
  const balanceBigInt = BigInt(balance || LAMPORTS_PER_SOL);

  if (balanceBigInt < amountLamports) {
    logger.error(`Insufficient balance!`);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Insufficient balance! Required: ${formatSolBalance(amountLamports)}, Available: ${formatSolBalance(balanceBigInt)}`,
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  try {
    const payload = await _Utils.serializeMysteryBoxPurchaseTx({
      amountLamports,
      account,
      buyer,
    });

    logger.info("Mystery Box Purchase transaction serialized successfully", {
      payload,
      buyer: account,
      amountInSol,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: ACTIONS_CORS_HEADERS,
    };
  } catch (e) {
    logger.error((e as Error).message, { error: e });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          (e as Error).message ||
          "Failed to generate mystery box purchase transaction. Please try again.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
};

export default generateMysteryBoxPurchaseTx;
