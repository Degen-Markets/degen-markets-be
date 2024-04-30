import { Logger } from "@aws-lambda-powertools/logger";
import { SecretClient } from "../clients/SecretClient";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { BetService } from "../bets/BetService";

export class SettlementService {
  private readonly logger = new Logger({ serviceName: "SettlementService" });
  private secretName = getMandatoryEnvVariable("PRIVATE_KEY_SECRET");
  private secretClient = new SecretClient();
  private betService = new BetService();

  handleSettlement = async () => {
    const privateKey = await this.secretClient.loadPlainTextSecretValue(
      this.secretName,
    );

    this.logger.info("handle settlement", {
      privateKeyLength: privateKey.length,
    });

    this.logger.info(
      "fetching bets that have not yet been settled and their expiration timestamp is overdue!",
    );
    const betsToSettle = await this.betService.findUnsettledBets();

    this.logger.info(`found ${betsToSettle.length} bet(s) to settle`);
  };
}
