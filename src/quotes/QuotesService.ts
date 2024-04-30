import axios from "axios";

export class QuotesService {
  async getLatestQuote(cmcId: number, metric: string): Promise<number> {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcId}`,
      {
        headers: {
          ["X-CMC_PRO_API_KEY"]: process.env.CMC_API_KEY,
          Accept: "application/json",
        },
      },
    );
    return response.data.data[cmcId].quote.USD[metric];
  }
}
