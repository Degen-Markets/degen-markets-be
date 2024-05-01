import { Logger } from "@aws-lambda-powertools/logger";
import { SecretClient } from "../clients/SecretClient";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { BetService } from "../bets/BetService";
import { QuotesService } from "../quotes/QuotesService";
import { getCmcId } from "../utils/cmcApi";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import DEGEN_BETS_ABI from "../../resources/abi/DegenBetsAbi.json";

export class SettlementService {
  private readonly logger = new Logger({ serviceName: "SettlementService" });
  private secretName = getMandatoryEnvVariable("PRIVATE_KEY_SECRET");
  private secretClient = new SecretClient();
  private betService = new BetService();
  private quotesService = new QuotesService();
  private readonly rpcUrl = getMandatoryEnvVariable("BASE_RPC_URL");
  private readonly degenBetsAddress =
    getMandatoryEnvVariable<`0x${string}`>("DEGEN_BETS_ADDRESS");

  handleSettlement = async () => {
    const privateKey =
      await this.secretClient.loadPlainTextSecretValue<`0x${string}`>(
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

    for (const bet of betsToSettle) {
      let winner: Address | undefined = undefined;
      if (!!bet.acceptor && bet.acceptor !== zeroAddress) {
        try {
          this.logger.info("Calling coinmarketcap api");
          const endingMetricValue = await this.quotesService.getLatestQuote(
            getCmcId(bet.ticker),
            bet.metric,
          );
          this.logger.info(
            `For bet ${bet.id} Ending metric value is: ${endingMetricValue}, startingMetric was: ${bet.startingMetricValue}`,
          );
          if (
            bet.isBetOnUp &&
            Number(endingMetricValue) > Number(bet.startingMetricValue)
          ) {
            this.logger.info(`Bet won by creator ${bet.creator}`);
            winner = bet.creator;
          } else {
            this.logger.info(`Bet won by acceptor ${bet.acceptor}`);
            winner = bet.acceptor;
          }
        } catch (e) {
          this.logger.error(
            `fetching quotes failed for bet ${bet.id}!`,
            e as Error,
          );
        }
      } else {
        this.logger.info(
          `bet ${bet.id} does not have an acceptor. Ignoring it!`,
        );
      }

      if (!!winner) {
        try {
          this.logger.info(`transferring funds to winner ${winner}`);
          const account = privateKeyToAccount(privateKey);
          this.logger.info(`using account ${account.address} to send funds`);

          const client = createWalletClient({
            account,
            chain: base,
            transport: http(this.rpcUrl),
          });

          const hash = await client.writeContract({
            address: this.degenBetsAddress,
            abi: DEGEN_BETS_ABI,
            functionName: "settleBet",
            args: [bet.id, winner],
          });

          this.logger.info(`settleBet transaction sent: ${hash}`);

          const publicClient = createPublicClient({
            chain: base,
            transport: http(this.rpcUrl),
          });

          await publicClient.waitForTransactionReceipt({
            hash,
          });

          this.logger.info(`settleBet transaction completed: ${hash}`);
        } catch (e) {
          this.logger.error(`settling bet failed!`, e as Error);
        }
      }
    }
  };
}
