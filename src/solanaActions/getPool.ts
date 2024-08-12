import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { program } from "./constants";
import { buildBadRequestError } from "../utils/errors";
import pools from "./pools.json";

const logger: Logger = new Logger({ serviceName: "getPoolService" });

export const getPool = async (event: APIGatewayEvent) => {
  const id = event.pathParameters?.id as keyof typeof pools;
  if (!id) {
    return buildBadRequestError("Missing pool id path parameter");
  }

  if (!pools[id]) {
    return buildBadRequestError("Invalid Pool ID!");
  }
  const pool = pools[id];

  logger.info(`loading pool with id: ${id}`);
  const poolAccount = await program.account.pool.fetch(id);
  if (poolAccount.hasConcluded) {
    // TODO: handle disabled button response
  }
  logger.info(JSON.stringify(poolAccount, null, 3));
  const actions = [
    ...pool.options.map((option) => ({
      label: `${option.title}`,
      href: `/pools/${id}/options/${option.id}?value={amount}`,
      parameters: [
        {
          name: "amount",
          label: "Enter a SOL amount",
        },
      ],
    })),
  ];
  const metadata: ActionGetResponse = {
    icon: pool.image,
    label: poolAccount.title,
    title: poolAccount.title,
    description: "",
    links: {
      actions: actions,
    },
  };
  return {
    statusCode: 200,
    body: JSON.stringify(metadata),
    headers: ACTIONS_CORS_HEADERS,
  };
};
