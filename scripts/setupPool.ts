import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = "What will Mika, Rasmr & Threadguy find in Ohio?";
  const description =
    "Resolves to 'cat genocide' if any of the 3 twitter accounts (@rasmr_eth, @mikadontlouz, @notthreadguy) reports more than 1 occurrence of a cat being murdered in Ohio by a human.";
  const optionTitles = ["cat genocide", "you thought? 🫵😹"];
  const isPaused = false;
  const winningOption = null;
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/mika_rasmr_thread_cats.png";
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
