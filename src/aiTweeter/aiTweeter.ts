import { ScheduledEvent } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import OpenAI from "openai";
import { sendBotTweet } from "../utils/twitterBot";
const openai = new OpenAI();

const logger = new Logger({ serviceName: "AITweeter" });

export const handler = async (event: ScheduledEvent) => {
  logger.info(`Ran scheduled event`, { event });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "you are a provocateur" },
      {
        role: "user",
        content: "give me 1 short sentence rage baiting crypto prediction",
      },
    ],
  });

  const firstChoice = response.choices[0]?.message;
  logger.info(`Came up with the following tweet: `, { tweet: firstChoice });

  if (firstChoice?.content) {
    // remove double quotes, because OpenAI adds it
    await sendBotTweet(firstChoice.content.replace(/\"/g, ""));
  }
};
