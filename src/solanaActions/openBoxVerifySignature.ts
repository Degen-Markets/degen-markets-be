import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  Action,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";

import { _Utils } from "../utils/serializedMysteryBoxTx";
import { buildBadRequestError } from "../utils/httpResponses";
import { convertSolToLamports, formatSolBalance } from "../../lib/utils";
import { connection } from "../clients/SolanaProgramClient";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { verifySignature } from "../utils/cryptography";
export const PRICE_PER_BOX = 0.02;

const logger: Logger = new Logger({
  serviceName: "boxSignatureVerifyMessage",
});

const boxSignatureVerifyMessage = async (event: APIGatewayProxyEventV2) => {
  const { account, signature } = JSON.parse(event.body || "{}");
  console.log({
    signature,
    account,
  });
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
  if (!signature) {
    logger.error("Signature missing", { account });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Signature is required to process the transaction.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
  const isSignatureValid = !verifySignature(signature, account); // correct it later

  const data: ActionPostResponse = {
    type: "post",
    message: "Invalid Signature,try again!",
    links: {
      next: {
        type: "post",
        href: "/mystery-box/open",
      },
    },
  };

  const signMessageAction = {
    type: "action",
    label: "Sign statement",
    icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
    title: "Please sign Message",
    description: "Signature failed in the previous session! please try again",
    links: {
      actions: [
        {
          type: "post",
          href: "/mystery-box/open",
          label: "Sign Message Again",
        },
      ],
    },
  } satisfies Action;

  if (!isSignatureValid) {
    return {
      statusCode: 200,
      body: JSON.stringify(signMessageAction),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  const payload: ActionPostResponse = {
    type: "post",
    message: "Finished!",
    links: {
      next: {
        type: "inline",
        action: {
          type: "completed",
          icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
          label: "Box opened successfully",
          description: `Signature Verified! signature status: ${isSignatureValid}`,
          title: "Box Opened",
          disabled: true,
        },
      },
    },
  };
  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default boxSignatureVerifyMessage;
