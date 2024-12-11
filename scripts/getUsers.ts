import axios from "axios";
import * as dotenv from "dotenv";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
dotenv.config();

const BEARER_TOKEN = getMandatoryEnvVariable("TWITTER_BOT_BEARER_TOKEN");

async function fetchUser(
  handle: string,
): Promise<{ userId: string; handle: typeof handle }> {
  try {
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${handle}`,
      {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      },
    );

    const userId = userResponse.data.data.id || "User not found.";
    return { handle, userId };
  } catch (error) {
    console.log(error);
    return { handle, userId: "Error fetching user." };
  }
}

Promise.all(
  [
    "0xTDG",
    "1solinfeb",
    "acriues",
    "yashhsm",
    "chooserich",
    "saracrypto_eth",
    "TriippyTrades",
    "moonshot",
    "metaversejoji",
    "crypto_gatsbyy",
    "YaboyB_Hux",
    "DegenerateNews",
  ].map((username) => fetchUser(username)),
).then(console.log);
