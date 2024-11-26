import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import {
  formatTweets,
  get3RandomTweets,
  getRandomPrompt,
  getRandomSystemRole,
} from "./utils";

const openai = new OpenAI({
  apiKey: getMandatoryEnvVariable("OPENAI_API_KEY"),
});

const logger = new Logger({ serviceName: "AITweeter" });

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
  const tweets = await get3RandomTweets();
  const formattedTweets = formatTweets(tweets);
  const basePrompt = getRandomPrompt();
  const systemRole = getRandomSystemRole();
  const temperature = Math.random() * 2;
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
    temperature,
  });

  const firstChoice = response.choices[0]?.message;
  logger.info(`Came up with the following tweet: `, {
    result: firstChoice,
    tweets,
    basePrompt,
    systemRole,
    temperature,
  });

  if (firstChoice?.content) {
    // remove double quotes, because OpenAI adds it
    // await sendBotTweet(firstChoice.content.replace(/"/g, ""));
  }
};
