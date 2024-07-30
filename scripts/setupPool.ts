import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = "Who will win the 2024 US Presidential Elections?";
  const optionTitles = ["Trump", "Harris", "Other"];
  const imageUrl =
    "https://dims.apnews.com/dims4/default/fe29e99/2147483647/strip/true/crop/4189x2793+0+0/resize/1440x960!/format/webp/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F%5B-%2F57%2F%2C%20-80%2C%2031%2C%2038%2C%20-86%2C%2061%2C%2053%2C%2080%2C%20-109%2C%2031%2C%2080%2C%20-117%2C%20-101%2C%20-37%2C%20-122%2C%20104%2C%20-49%2C%2039%2C%20-54%2C%2089%2C%20-80%2C%20-24%2C%2033%2C%20-126%2C%20-3%2C%2025%2C%20-122%2C%20-85%5D%2Fd964c24c093f4639afc081a07571025d";
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
      image: imageUrl,
      options: optionTitles.map((optionTitle, optionIndex) => ({
        title: optionTitle,
        id: optionAccountKeys[optionIndex],
      })),
    },
  };
  fs.writeFileSync(
    `${process.cwd()}/src/solanaActions/pools.json`,
    JSON.stringify(newPools),
  );
  return newPools;
};

main().then(console.log).catch(console.log);
