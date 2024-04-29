import { Logger } from "@aws-lambda-powertools/logger";
import { DatabaseClient } from "../clients/DatabaseClient";
import { BetEntity } from "../bets/BetEntity";

export class BetService {
  private readonly logger = new Logger({ serviceName: "BetService" });
  private readonly databaseClient = new DatabaseClient<BetEntity>();

  findBets = async (): Promise<BetEntity[]> => {
    this.logger.info("fetching bets");
    const response = await this.databaseClient.executeStatement(
      "SELECT * FROM bets;",
    );
    return response.rows;
  };

  createBets = async (
    bets: Partial<BetEntity>[],
  ): Promise<BetEntity[] | null> => {
    this.logger.info(`creating bet rows`);
    try {
      const values = bets
        .map(
          (bet) => `(
        '${bet.id}',
        '${bet.creator}',
        '${bet.creationTimestamp}',
        '${bet.ticker}',
        '${bet.metric}',
        '${bet.isBetOnUp}',
        '${bet.expiresAt}',
        '${bet.value}',
        '${bet.currency}'
      )`,
        )
        .join(", ");

      const response = await this.databaseClient.executeStatement(
        `INSERT INTO bets (
          id,
          creator,
          creationTimestamp,
          ticker,
          metric,
          isBetOnUp,
          expiresAt,
          value,
          currency
        ) VALUES ${values}`,
      );

      return response.rows; // Assuming your response contains inserted rows, adjust if needed
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };
}
