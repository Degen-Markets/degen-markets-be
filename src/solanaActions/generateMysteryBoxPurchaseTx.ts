import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

import { _Utils } from "../utils/serializedMysteryBoxTx";

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

  if (!amountInSol || !account) {
    logger.error("Invalid parameters", { amountInSol, account });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid amount format. Please provide a valid SOL amount.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  try {
    const payload = await _Utils.serializeMysteryBoxPurchaseTx({
      amountInSol,
      account,
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
