import { Logger } from "@aws-lambda-powertools/logger";
import { BetEntity } from "./BetEntity";
import { DatabaseClient } from "../clients/DatabaseClient";

export class BetService {
  private readonly logger = new Logger({ serviceName: "BetService" });
  private readonly databaseClient = new DatabaseClient<BetEntity>();

  findBets = async (): Promise<BetEntity[]> => {
    this.logger.info("fetching bets");
    const response = await this.databaseClient.executeStatement(
      "select * from bets;",
    );
    return response.rows;
  };

  createBet = async (bet: Partial<BetEntity>): Promise<BetEntity | null> => {
    this.logger.info(`creating bet row with ${bet}`);
    try {
      const response = await this.databaseClient.executeStatement(
        `INSERT INTO 
          bets (
            id,
            creator,
            creationTimestamp,
            ticker,
            metric,
            isBetOnUp,
            expiresAt,
            value,
            currency,
          ) values (
            ${bet.id},
            ${bet.creator},
            ${bet.creationTimestamp},
            ${bet.ticker},
            ${bet.metric},
            ${bet.isBetOnUp},
            ${bet.expiresAt},
          )
        `.replace(/\r?\n|\r/g, " "),
      );
      return response.rows[0];
    } catch (e) {
      this.logger.error((e as Error).message, e as Error);
      return null;
    }
  };
}
