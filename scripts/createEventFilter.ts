import * as fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const queryFileName = `${process.cwd()}/resources/graphql/BetPaid.gql`;
const query = fs.readFileSync(queryFileName).toString();

axios.post(
  "https://dashboard.alchemy.com/api/create-webhook",
  {
    network: "BASE_MAINNET",
    webhook_type: "GRAPHQL",
    webhook_url: "https://webhooks.degenmarkets.com/bet-paid",
    graphql_query: {
      skip_empty_messages: true,
      query,
    },
  },
  {
    headers: {
      ["X-Alchemy-Token"]: process.env.ALCHEMY_WEBHOOK_TOKEN,
      accept: "application/json",
      ["content-type"]: "application/json",
    },
  },
);
