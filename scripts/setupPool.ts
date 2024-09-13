import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = "Will SOL reach $150 by Breakpoint?";
  const description =
    "Resolves to 'Yes' if the price of SOL reaches $150 on a major exchange from now until the start of Solana Breakpoint (20th September 2024)";
  const optionTitles = ["Yes", "No"];
  const isPaused = false;
  const winningOption = null;
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/solana-breakpoint.jpeg";
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
