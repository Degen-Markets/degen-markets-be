import axios from "axios";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { Logger } from "@aws-lambda-powertools/logger";

export class QuotesService {
  private readonly logger = new Logger({ serviceName: "BetService" });
  async getLatestQuote(cmcId: number, metric: string): Promise<string> {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcId}`,
      {
        headers: {
          ["X-CMC_PRO_API_KEY"]: getMandatoryEnvVariable("CMC_API_KEY"),
          Accept: "application/json",
        },
      },
    );
    this.logger.info(`Got CMC response, ${JSON.stringify(response.data.data)}`);
    return String(response.data.data[cmcId].quote.USD[metric]);
  }
}
