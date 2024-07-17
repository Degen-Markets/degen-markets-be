import { DatabaseClient } from "../clients/DatabaseClient";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda/trigger/api-gateway-proxy";
import { Logger } from "@aws-lambda-powertools/logger";
import { Player } from "./types";

const databaseClient = new DatabaseClient();

const logger = new Logger({ serviceName: "PlayerService" });

export const getSafeOrderByColumn = (queryParam: string): string => {
  switch (queryParam) {
    case "betCount":
    default:
      return "betCount";
  }
};

export const findAllPlayers = async (
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
): Promise<Player[]> => {
  logger.info(
    `fetching players with query params: ${JSON.stringify(queryStringParameters)}`,
  );
  let limit = 10;
  if (!isNaN(Number(queryStringParameters?.limit))) {
    limit = Number(queryStringParameters?.limit);
  }
  logger.info(`Limit is ${limit}`);

  let offset = 0;
  if (!isNaN(Number(queryStringParameters?.offset))) {
    offset = Number(queryStringParameters?.offset);
  }
  logger.info(`Offset is ${offset}`);

  let orderBy = "betCount";
  let orderByDirection = "DESC";
  if (queryStringParameters?.sort) {
    const includesOrderByDirection = queryStringParameters.sort.includes(":");
    const orderByField = includesOrderByDirection
      ? queryStringParameters.sort.split(":")[0]
      : queryStringParameters.sort;
    if (
      includesOrderByDirection &&
      queryStringParameters.sort.split(":")[1].toLowerCase() === "asc"
    ) {
      orderByDirection = "ASC";
    }
    orderBy = getSafeOrderByColumn(orderByField);
  }

  const query = `
      SELECT id, COUNT(*) as "betCount"
          FROM (
               SELECT creator AS id FROM bets
               UNION ALL
               SELECT acceptor AS id FROM bets WHERE acceptor IS NOT NULL
           ) AS combined
          GROUP BY id ORDER BY "${orderBy}" ${orderByDirection} LIMIT ${limit} OFFSET ${offset};
  `;

  const result = await databaseClient.executeStatement<Player>(query);
  logger.debug(JSON.stringify(result));
  return result.rows;
};
