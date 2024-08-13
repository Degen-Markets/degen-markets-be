import axios from "axios";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";

type CoinMetrics = {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  last_updated: string;
};

type CoinMetricsSansTimestamp = Omit<CoinMetrics, "last_updated">;

export class QuotesService {
  private readonly logger = new Logger({ serviceName: "QuotesService" });
  private readonly cmcApiKey = getMandatoryEnvVariable("CMC_API_KEY");
  async getLatestQuote(cmcId: number, metric: string): Promise<string> {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcId}`,
      {
        headers: {
          ["X-CMC_PRO_API_KEY"]: this.cmcApiKey,
          Accept: "application/json",
        },
      },
    );
    this.logger.info(`Got CMC response, ${JSON.stringify(response.data.data)}`);
    return String(response.data.data[cmcId].quote.USD[metric]);
  }

  async getLatestMetrics(cmcId: number): Promise<CoinMetricsSansTimestamp> {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcId}`,
      {
        headers: {
          ["X-CMC_PRO_API_KEY"]: this.cmcApiKey,
          Accept: "application/json",
        },
      },
    );
    this.logger.info(`Got CMC response, ${JSON.stringify(response.data.data)}`);
    const { last_updated, ...metrics } = response.data.data[cmcId].quote
      .USD as CoinMetrics;
    return metrics;
  }
}
