import { Action, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { ActionPostResponse, SignMessageResponse } from "@solana/actions-spec";
import { messageString, verifySignature } from "../utils/cryptography";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";

const logger: Logger = new Logger({
  serviceName: "boxSignatureVerifyMessage",
});

const boxSignMessageAndVerify = async (event: APIGatewayProxyEventV2) => {
  const boxCount = event.queryStringParameters?.boxCount;
  const { account, signature } = JSON.parse(event.body || "{}");

  if (boxCount) {
    const response: SignMessageResponse = {
      type: "message",
      data: messageString,
      links: {
        next: {
          type: "post",
          href: "/mystery-box/open",
        },
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  logger.info("Received event for box signature verification", {
    body: event.body,
  });

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

  // if the signature is valid we should set the box:isOpened field on it to true

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

export default boxSignMessageAndVerify;
