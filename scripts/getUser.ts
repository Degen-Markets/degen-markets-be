import axios from "axios";
import * as dotenv from "dotenv";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
dotenv.config();

const BEARER_TOKEN = getMandatoryEnvVariable("TWITTER_BOT_BEARER_TOKEN");

async function fetchUser(username: string): Promise<{ userId: string }> {
  try {
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      },
    );

    const userId = userResponse.data.data.id || "User not found.";
    return { userId };
  } catch (error) {
    console.log(error);
    return { userId: "Error fetching user." };
  }
}

fetchUser("blknoiz06").then(console.log);
