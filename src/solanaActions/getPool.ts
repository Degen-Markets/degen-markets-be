import { APIGatewayEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { program } from "./constants";
import { buildBadRequestError } from "../utils/errors";
import pools from "./pools.json";
import { LinkedAction } from "@solana/actions-spec";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

const logger: Logger = new Logger({ serviceName: "GetPoolService" });

interface PoolResponse extends ActionGetResponse {
  links: {
    actions: LinkedAction[];
  };
}

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
  let poolAccount: {
    title: string;
    hasConcluded: boolean;
    value: BN;
    winningOption: PublicKey;
  } = {
    title: pool.title,
    hasConcluded: true,
    value: new BN(0),
    winningOption: SystemProgram.programId,
  };
  let description: string = "";
  try {
    poolAccount = await program.account.pool.fetch(id);
    logger.info(`Pool Found: ${JSON.stringify(poolAccount, null, 3)}`);
  } catch (e) {
    description = "Pool ended!";
  }
  const metadata: PoolResponse = {
    icon: pool.image,
    label: pool.title,
    title: pool.title,
    description,
    links: {
      actions: [],
    },
  };
  if (poolAccount.hasConcluded) {
    const winningOption = pool.options.find(
      (option) => option.id === poolAccount.winningOption.toString(),
    );
    if (winningOption) {
      metadata.links.actions = [
        {
          label: `Claim Win (${winningOption.title})`,
          href: `/pools/${id}/options/${winningOption.id}/claim-win`,
        },
      ];
    }
  } else {
    metadata.links.actions = [
      ...pool.options.map((option) => ({
        label: `Bet 1 SOL on "${option.title}"`,
        href: `/pools/${id}/options/${option.id}?value=1`,
      })),
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
  }

  return {
    statusCode: 200,
    body: JSON.stringify(metadata),
    headers: ACTIONS_CORS_HEADERS,
  };
};
