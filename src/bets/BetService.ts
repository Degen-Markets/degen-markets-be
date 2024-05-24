import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { BetEntity } from "./BetEntity";
import {
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
} from "aws-lambda/trigger/api-gateway-proxy";
import { WithdrawBetSqsEvent } from "../webhookApi/types/WithdrawBetTypes";
import { BetCreatedSqsEvent } from "../webhookApi/types/BetCreatedTypes";
import { isNumeric } from "../utils/numbers";
import { SettleBetSqsEvent } from "../webhookApi/types/SettleBetTypes";

export class BetService {
  private readonly logger = new Logger({ serviceName: "BetService" });
  private readonly databaseClient = new DatabaseClient<BetEntity>();

  getSafeOrderByColumn = (queryParam: string): string => {
    switch (queryParam) {
      case "creator":
      case "acceptor":
      case "value":
      case "ticker":
      case "metric":
      case "currency":
        return queryParam;
      case "creationTimestamp":
        return '"creationTimestamp"';
      case "expirationTimestamp":
        return '"expirationTimestamp"';
      case "withdrawalTimestamp":
        return '"withdrawalTimestamp"';
      case "lastActivityTimestamp":
      default:
        return '"lastActivityTimestamp"';
    }
  };

  findBetById = async (
    pathParameters: APIGatewayProxyEventPathParameters | null,
  ): Promise<BetEntity> => {
    this.logger.info(
      `Finding bet by id. With path params: ${JSON.stringify(pathParameters)}`,
    );

    let query = "SELECT * FROM bets WHERE id = $1";
    const values: any[] = [pathParameters?.id];

    const response = await this.databaseClient.executeStatement(query, values);
    return response.rows[0];
  };

  findBets = async (
    queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
  ): Promise<BetEntity[]> => {
    this.logger.info(
      `fetching bets with query params: ${JSON.stringify(queryStringParameters)}`,
    );

    let query = "SELECT * FROM bets";
    const values: any[] = [];

    if (queryStringParameters?.creator) {
      query += " WHERE creator = $1";
      values.push(queryStringParameters.creator);
    }

    if (queryStringParameters?.sort) {
      const includesOrderByDirection = queryStringParameters.sort.includes(":");
      const orderByField = includesOrderByDirection
        ? queryStringParameters.sort.split(":")[0]
        : queryStringParameters.sort;
      const orderByDirection =
        includesOrderByDirection &&
        queryStringParameters.sort.split(":")[1].toLowerCase() === "asc"
          ? "ASC"
          : "DESC";
      const safeOrderByColumn = this.getSafeOrderByColumn(orderByField);
      query += ` ORDER BY ${safeOrderByColumn} ${orderByDirection}`;
    }

    if (
      queryStringParameters?.limit &&
      isNumeric(queryStringParameters.limit)
    ) {
      query += ` LIMIT ${queryStringParameters.limit}`;
    }

    const response = await this.databaseClient.executeStatement(query, values);
    return response.rows;
  };

  findOne = async (id: string): Promise<BetEntity> => {
    const query = "SELECT * FROM bets WHERE id = $1";
    const response = await this.databaseClient.executeStatement(query, [id]);
    return response.rows[0];
  };

  findUnsettledBets = async (): Promise<BetEntity[]> => {
    const query = `SELECT * FROM bets WHERE winner IS NULL AND acceptor IS NOT NULL AND "expirationTimestamp" < ${Date.now() / 1000}`;
    const response = await this.databaseClient.executeStatement(query);
    return response.rows;
  };

  createBets = async (
    bets: BetCreatedSqsEvent[],
  ): Promise<BetEntity[] | null> => {
    this.logger.info(`creating bet rows`);
    try {
      const values = bets.map(
        () => `($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      );
      const insertValues = bets.flatMap((bet) => [
        bet.id,
        bet.creator,
        bet.creationTimestamp,
        bet.ticker,
        bet.metric,
        bet.isBetOnUp,
        bet.expirationTimestamp,
        bet.value,
        bet.currency,
        bet.creationTimestamp,
      ]);

      const response = await this.databaseClient.executeStatement(
        `INSERT INTO bets (
          id,
          creator,
          "creationTimestamp",
          ticker,
          metric,
          "isBetOnUp",
          "expirationTimestamp",
          value,
          currency,
          "lastActivityTimestamp"
        ) VALUES ${values.join(", ")};`,
        insertValues,
      );

      return response.rows; // Assuming your response contains inserted rows, adjust if needed
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };

  createV2Bets = async (
    bets: BetCreatedSqsEvent[],
  ): Promise<BetEntity[] | null> => {
    this.logger.info(`creating bet rows`);
    const values = bets.map(
      () => `($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    );
    const insertValues = bets.flatMap((bet) => [
      bet.id,
      bet.betType,
      bet.creator,
      bet.creationTimestamp,
      bet.ticker,
      bet.metric,
      bet.isBetOnUp,
      bet.expirationTimestamp,
      bet.value,
      bet.currency,
      bet.creationTimestamp,
      bet.strikePriceCreator,
      bet.chain,
    ]);

    const response = await this.databaseClient.executeStatement(
      `INSERT INTO bets (
          id,
          "type",
          creator,
          "creationTimestamp",
          ticker,
          metric,
          "isBetOnUp",
          "expirationTimestamp",
          value,
          currency,
          "lastActivityTimestamp",
          "strikePriceCreator",
          chain
        ) VALUES ${values.join(", ")};`,
      insertValues,
    );

    return response.rows; // Assuming your response contains inserted rows, adjust if needed
  };

  acceptBets = async (
    bets: Partial<BetEntity>[],
  ): Promise<BetEntity[] | null> => {
    try {
      const statements = bets.map(
        () => `
        UPDATE bets
        SET acceptor = $1,
            "acceptanceTimestamp" = $2,
            "lastActivityTimestamp" = $2,
            "startingMetricValue" = $3
        WHERE id = $4;
      `,
      );

      const updateValues = bets.map((bet) => [
        bet.acceptor,
        bet.acceptanceTimestamp,
        bet.startingMetricValue,
        bet.id,
      ]);

      const results = await this.databaseClient.executeStatements(
        statements,
        updateValues,
      );
      return results.map((result) => result.rows[0]);
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };

  acceptV2Bets = async (
    bets: Partial<BetEntity>[],
  ): Promise<BetEntity[] | null> => {
    try {
      const statements = bets.map(
        () => `
        UPDATE bets
        SET acceptor = $1,
            "acceptanceTimestamp" = $2,
            "lastActivityTimestamp" = $2,
            "startingMetricValue" = $3,
            "strikePriceAcceptor" = $4
        WHERE id = $5;
      `,
      );

      const updateValues = bets.map((bet) => [
        bet.acceptor,
        bet.acceptanceTimestamp,
        bet.startingMetricValue,
        bet.strikePriceAcceptor,
        bet.id,
      ]);

      const results = await this.databaseClient.executeStatements(
        statements,
        updateValues,
      );
      return results.map((result) => result.rows[0]);
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };

  withdrawBets = async (
    bets: WithdrawBetSqsEvent[],
  ): Promise<BetEntity[] | null> => {
    try {
      const statements = bets.map(
        () => `
        UPDATE bets
        SET "isWithdrawn" = true,
            "withdrawalTimestamp" = $1,
            "lastActivityTimestamp" = $1
        WHERE id = $2;
      `,
      );

      const updateValues = bets.map((bet) => [bet.withdrawalTimestamp, bet.id]);

      const results = await this.databaseClient.executeStatements(
        statements,
        updateValues,
      );
      return results.map((result) => result.rows[0]);
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };

  settleV2Bets = async (bets: BetEntity[]) => {
    const statements = bets.map(
      () => `
        UPDATE bets
        SET "winner" = $1,
            "winTimestamp" = $2,
            "lastActivityTimestamp" = $2,
            "endingMetricValue" = $3
        WHERE id = $4;
      `,
    );

    const updateValues = bets.map((bet) => [
      bet.winner,
      bet.winTimestamp,
      bet.endingMetricValue,
      bet.id,
    ]);

    const results = await this.databaseClient.executeStatements(
      statements,
      updateValues,
    );
    return results.map((result) => result.rows[0]);
  };

  settleBets = async (bets: SettleBetSqsEvent[]) => {
    try {
      const statements = bets.map(
        () => `
        UPDATE bets
        SET "winner" = $1,
            "winTimestamp" = $2,
            "lastActivityTimestamp" = $2
        WHERE id = $3;
      `,
      );

      const updateValues = bets.map((bet) => [
        bet.winner,
        bet.winTimestamp,
        bet.id,
      ]);

      const results = await this.databaseClient.executeStatements(
        statements,
        updateValues,
      );
      return results.map((result) => result.rows[0]);
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };
}
