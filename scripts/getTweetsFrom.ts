import axios from "axios";
import { getMandatoryEnvVariable } from "../src/utils/getMandatoryEnvValue";
import { config } from "dotenv";
config();

async function fetchLastTweet(userId: string): Promise<string> {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=replies,retweets&max_results=5`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${getMandatoryEnvVariable("TWITTER_BOT_BEARER_TOKEN")}`,
      },
    });
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].text;
    } else {
      return "No tweets found.";
    }
  } catch (error: any) {
    console.error(
      "Error fetching last tweet:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to fetch last tweet.");
  }
}

fetchLastTweet("1505874016761831430").then(console.log);
