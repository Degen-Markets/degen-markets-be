import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  Action,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";

import { verifySignature } from "../utils/cryptography";
export const PRICE_PER_BOX = 0.02;

const logger: Logger = new Logger({
  serviceName: "boxSignatureVerifyMessage",
});

const boxSignatureVerifyMessage = async (event: APIGatewayProxyEventV2) => {
  logger.info("Received event for box signature verification", {
    body: event.body,
  });

  const { account, signature } = JSON.parse(event.body || "{}");

  logger.debug("Parsed input values", { account, signature });

  if (!account) {
    logger.error("Missing account address in the request");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Account address is required to process the transaction.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  if (!signature) {
    logger.error("Missing signature in the request", { account });
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Signature is required to process the transaction.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  logger.info("Verifying signature", { account, signature });

  const isSignatureValid = verifySignature(signature, account);

  if (!isSignatureValid) {
    logger.warn("Signature verification failed", { account, signature });
    const signMessageAction = {
      type: "action",
      label: "Sign statement",
      icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
      title: "Please sign Message",
      description:
        "Signature failed in the previous session! Please try again.",
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

    logger.info("Returning action for re-signing the message");
    return {
      statusCode: 200,
      body: JSON.stringify(signMessageAction),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  logger.info("Signature verification succeeded", { account });

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
          description: `Signature Verified! Signature status: ${isSignatureValid}`,
          title: "Box Opened",
          disabled: true,
        },
      },
    },
  };

  logger.info("Returning success response with verified signature payload", {
    payload,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(payload),
    headers: ACTIONS_CORS_HEADERS,
  };
};

export default boxSignatureVerifyMessage;
