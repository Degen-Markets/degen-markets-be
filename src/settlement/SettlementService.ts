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
  formatEther,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import DEGEN_BETS_V2_ABI from "../../resources/abi/DegenBetsV2Abi.json";
import { BetEntity } from "../bets/BetEntity";
import { sendSlackBalanceUpdate } from "../notifications/NotificationsService";

export class SettlementService {
  private readonly logger = new Logger({ serviceName: "SettlementService" });
  private secretName = getMandatoryEnvVariable("PRIVATE_KEY_SECRET");
  private secretClient = new SecretClient();
  private betService = new BetService();
  private quotesService = new QuotesService();
  private readonly rpcUrl = getMandatoryEnvVariable("BASE_RPC_URL");
  private readonly degenBetsAddress =
    getMandatoryEnvVariable<`0x${string}`>("DEGEN_BETS_ADDRESS");
  private readonly degenBetsV2Address = getMandatoryEnvVariable<`0x${string}`>(
    "DEGEN_BETS_V2_ADDRESS",
  );

  isBetV2 = (bet: BetEntity) => bet.strikePriceCreator !== null;

  handleSettlement = async (): Promise<BetEntity[]> => {
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

    if (betsToSettle.length === 0) {
      this.logger.info("No bets to settle, closing lambda");
      return betsToSettle;
    }

    const account = privateKeyToAccount(privateKey);
    this.logger.info(`using account ${account.address} to send funds`);

    const client = createWalletClient({
      account,
      chain: base,
      transport: http(this.rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: base,
      transport: http(this.rpcUrl),
    });

    const bets: BetEntity[] = [];

    for (const bet of betsToSettle) {
      let winner: Address | null = null;
      let endingMetricValue: string | null = null;
      try {
        this.logger.info("Calling coinmarketcap api");
        endingMetricValue = await this.quotesService.getLatestQuote(
          getCmcId(bet.ticker),
          bet.metric,
        );
        this.logger.info(
          `For bet ${bet.id} Ending metric value is: ${endingMetricValue}, startingMetric was: ${bet.startingMetricValue}`,
        );
        if (
          (bet.isBetOnUp &&
            Number(endingMetricValue) > Number(bet.startingMetricValue)) ||
          (!bet.isBetOnUp &&
            Number(endingMetricValue) < Number(bet.startingMetricValue))
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

      const winTimestamp = Math.ceil(Date.now() / 1000);

      if (!!winner && !!endingMetricValue) {
        bets.push({
          ...bet,
          winner,
          winTimestamp,
          endingMetricValue,
        });
      }
    }

    if (bets.length > 0) {
      const winners = bets.map((bet) => bet.winner);
      const betIds = bets.map((bet) => bet.id);
      try {
        this.logger.info(`Setting winners for ${bets.length} bets`);

        const hash = await client.writeContract({
          address: this.degenBetsV2Address,
          abi: DEGEN_BETS_V2_ABI,
          functionName: "setWinners",
          args: [betIds, winners],
        });

        this.logger.info(`setWinners tx sent: ${hash}`);

        await publicClient.waitForTransactionReceipt({
          hash,
        });

        this.logger.info(`setWinners tx completed: ${hash}`);
      } catch (e) {
        this.logger.error(`setWinners tx failed!`, e as Error);
      }

      try {
        await this.betService.settleV2Bets(bets);
      } catch (e) {
        this.logger.error("Setting winners on db failed", e as Error);
      }
    }

    try {
      const balance = await publicClient.getBalance({
        address: account.address,
      });
      const balanceInEth = formatEther(balance);
      this.logger.info(`Balance after settlements: ${balanceInEth}`);
      await sendSlackBalanceUpdate(
        `Current Balance of settling wallet: *${Number(balanceInEth).toFixed(4)} ETH*.\n\nTo fund, send base ETH to ${account.address}.\n\n-------------------------------------------------------------------------------------`,
      );
    } catch (e) {
      this.logger.error(
        "Error in fetching & sending balance update",
        e as Error,
      );
    }
    return betsToSettle;
  };
}
