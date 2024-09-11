import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = "How many cats will be eaten in Ohio by the end of the week?";
  const description =
    "An average will be taken using several news sources that will be documented afterwards. The time period is from now until 15.09.2024 23:59 UTC.";
  const optionTitles = ["Less than 10", "10 or more 🙀"];
  const isPaused = false;
  const winningOption = null;
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/trump_holding_cats.jpeg";
  // const poolAccountKey = await derivePoolAccountKey(title);
  const poolAccountKey = await createPool(title, adminAccount);
  const optionAccountKeys = await Promise.all(
    optionTitles.map((optionTitle) => {
      // return deriveOptionAccountKey(optionTitle, poolAccountKey);
      return createOption(optionTitle, adminAccount, poolAccountKey);
    }),
  );
  const newPools = {
    ...pools,
    [poolAccountKey.toString()]: {
      title,
      description,
      image: imageUrl,
      isPaused,
      winningOption,
      options: optionTitles.map((optionTitle, optionIndex) => ({
        title: optionTitle,
        id: optionAccountKeys[optionIndex],
      })),
    },
  };
  fs.writeFileSync(
    `${process.cwd()}/src/solanaActions/pools.json`,
    JSON.stringify(newPools, null, 2),
  );
  return newPools;
};

main().then(console.log).catch(console.log);
