import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { BetEntity } from "./BetEntity";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda/trigger/api-gateway-proxy";
import { WithdrawBetSqsEvent } from "../webhookApi/types/WithdrawBetTypes";
import { CreateBetSqsEvent } from "../webhookApi/types/CreateBetTypes";

export class BetService {
  private readonly logger = new Logger({ serviceName: "BetService" });
  private readonly databaseClient = new DatabaseClient<BetEntity>();

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

    const response = await this.databaseClient.executeStatement(query, values);
    return response.rows;
  };

  createBets = async (
    bets: CreateBetSqsEvent[],
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

  acceptBets = async (
    bets: Partial<BetEntity>[],
  ): Promise<BetEntity[] | null> => {
    try {
      const statements = bets.map(
        () => `
        UPDATE bets
        SET acceptor = $1,
            "acceptanceTimestamp" = $2,
            "lastActivityTimestamp" = $2
        WHERE id = $3;
      `,
      );

      const updateValues = bets.map((bet) => [
        bet.acceptor,
        bet.acceptanceTimestamp,
        bet.id,
      ]);

      const results = await this.databaseClient.executeStatements(
        statements,
        updateValues,
      );
      // Assuming response.rows contains the updated rows, adjust accordingly
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
      // Assuming response.rows contains the updated rows, adjust accordingly
      return results.map((result) => result.rows[0]);
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };
}
