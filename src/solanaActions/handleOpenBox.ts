import { Action, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { ActionPostResponse, SignMessageResponse } from "@solana/actions-spec";
import { messageString, verifySignature } from "../utils/cryptography";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import MysteryBoxServices from "../boxes/service";

const logger: Logger = new Logger({
  serviceName: "boxSignatureVerifyMessage",
});

const handleOpenBox = async (event: APIGatewayProxyEventV2) => {
  const boxCount = event.queryStringParameters?.boxCount;
  const boxPosition = event.queryStringParameters?.currentBoxPosition;
  const currentBoxPosition = Number(boxPosition);
  logger.info("Received event for box signature verification", {
    body: event.body,
  });

  const { account, signature } = JSON.parse(event.body || "{}");
  // for sign-message, runs only once when user purchase Box
  if (boxCount) {
    const response: SignMessageResponse = {
      type: "message",
      data: messageString,
      links: {
        next: {
          type: "post",
          href: "/mystery-boxes/open?currentBoxPosition=0",
        },
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: ACTIONS_CORS_HEADERS,
    };
  }

  logger.debug("Parsed input values", {
    account,
    signature,
    currentBoxPosition,
  });

  if (!account || !signature || currentBoxPosition === undefined) {
    logger.error("Missing required parameters in the request");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Account, signature and currentBoxPosition are required.`,
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
            href: `/mystery-boxes/open?boxCount=${boxCount}&currentBoxPosition=0`,
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

  try {
    // Get the box counts (total, opened, unopened)
    const boxCountStats = await MysteryBoxServices.getBoxCount(account);
    logger.info("Box count statistics fetched", { boxCountStats });

    const { totalBoxes, openedBoxes, unopenedBoxes } = boxCountStats;

    // Get unopened boxes for the player
    const unopenedBoxesList =
      await MysteryBoxServices.getUnopenedBoxesForPlayer(account);

    if (unopenedBoxesList.length === 0) {
      logger.info("No unopened boxes found for player", { account });
      const payload: ActionPostResponse = {
        type: "post",
        message: "All boxes opened!",
        links: {
          next: {
            type: "inline",
            action: {
              type: "completed",
              icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
              label: "All boxes opened",
              description: "You've opened all your boxes!",
              title: "Boxes Complete",
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
    }

    if (!unopenedBoxesList[0]) {
      logger.error("Unexpected error: unopenedBoxes array is empty");
      throw new Error("Unexpected error: unopenedBoxes array is empty.");
    }

    await MysteryBoxServices.openBox(account, unopenedBoxesList[0].id);
    const remainingBoxes = totalBoxes - openedBoxes; // Remaining unopened boxes
    const nextBoxPosition = openedBoxes + 1; // Next box to open

    const nextAction: ActionPostResponse =
      remainingBoxes > 0
        ? {
            type: "post",
            message: `Continue opening boxes. totalBoxes:${totalBoxes} openedBoxes:${openedBoxes}, unopenedBoxes:${unopenedBoxes})`,

            links: {
              next: {
                type: "inline",
                action: {
                  type: "action",
                  icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
                  label: `Open Box #${nextBoxPosition}`,
                  // Corrected description
                  description: `You've opened ${openedBoxes} boxes. ${remainingBoxes} boxes left to open.`,
                  title: "Open Next Box",
                  links: {
                    actions: [
                      {
                        type: "post",
                        href: `/mystery-boxes/open?currentBoxPosition=${nextBoxPosition}`,
                        label: `Open Box #${nextBoxPosition}`,
                      },
                    ],
                  },
                },
              },
            },
          }
        : {
            type: "post",
            message: `All boxes opened,  totalBoxes:${totalBoxes} openedBoxes:${openedBoxes}, unopenedBoxes:${unopenedBoxes})`,
            links: {
              next: {
                type: "inline",
                action: {
                  type: "completed",
                  icon: "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mysteryBox.jpg",
                  label: "All boxes opened",
                  description: `You've opened all ${totalBoxes} boxes!`,
                  title: "Boxes Complete",
                  disabled: true,
                },
              },
            },
          };

    return {
      statusCode: 200,
      body: JSON.stringify(nextAction),
      headers: ACTIONS_CORS_HEADERS,
    };
  } catch (error) {
    logger.error("Error processing box opening", { error, account });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An error occurred while processing your request.",
      }),
      headers: ACTIONS_CORS_HEADERS,
    };
  }
};

export default handleOpenBox;
