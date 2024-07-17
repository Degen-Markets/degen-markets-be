import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse } from "@solana/actions";

const logger: Logger = new Logger({ serviceName: "Actions/GetMetadata" });

export const getMetadata = async (
  event: APIGatewayEvent,
): Promise<ActionGetResponse> => {
  const queryParams = event.queryStringParameters;
  const betId = event.queryStringParameters?.betId;
  const optionIndex = event.queryStringParameters?.optionIndex;
  logger.info(
    `Got /GET metadata request for bet: ${betId} for option ${optionIndex}`,
  );
  return {
    icon: "https://x.com/degnben/status/1806519028514509133/photo/1",
    label: "",
    description: "Accept bet",
    title: "Accept bet",
    links: {
      actions: [
        {
          label: "Send 1 SOL", // button text
          href: `https://degenmarkets.com&amount=${"1"}`,
        },
      ],
    },
  };
};
