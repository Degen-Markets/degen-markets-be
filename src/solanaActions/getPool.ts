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
      label: `Bet 1 SOL on ${option.title}`,
      href: `/pools/${id}/options/${option.id}?value=1`,
    })),
    ...pool.options.map((option) => ({
      label: `Bet on ${option.title}`,
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
    icon: "https://ucarecdn.com/bb6ebebc-a810-4943-906d-5e3c2ca17b8d/-/preview/880x880/-/quality/smart/-/format/auto/",
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
