import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = "What will be the $degod market cap at the end of the week?";
  const description =
    "Resolves based on the market capitalisation of $degod at 3pm (CET) on the 22nd of September 2024. ";
  const optionTitles = ["Mid. Less than 80M", "Degod Mode. > 80M"];
  const isPaused = false;
  const winningOption = null;
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/degod_mcap.jpeg";
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
