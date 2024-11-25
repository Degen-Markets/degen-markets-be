import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import { formatTweets, get3RandomTweets, getRandomSystemRole } from "./utils";

const openai = new OpenAI({
  apiKey: getMandatoryEnvVariable("OPENAI_API_KEY"),
});

const logger = new Logger({ serviceName: "AITweeter" });

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
  const tweets = await get3RandomTweets();
  const formattedTweets = formatTweets(tweets);
  const basePrompt =
    "Give me a short degenerate sentence (no more than 15 words) based on these 3 tweets without using any emojis:";
  const systemRole = getRandomSystemRole();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemRole,
      },
      {
        role: "user",
        content: `${basePrompt} ${formattedTweets}`,
      },
    ],
  });

  const firstChoice = response.choices[0]?.message;
  logger.info(`Came up with the following tweet: `, {
    result: firstChoice,
    tweets,
    basePrompt,
    systemRole,
  });

  if (firstChoice?.content) {
    // remove double quotes, because OpenAI adds it
    // await sendBotTweet(firstChoice.content.replace(/"/g, ""));
  }
};
