import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = `@pumpdotfun founder revealed to be Indian by EoY`;
  const description =
    "@a1lon9 revealed to be of Indian origin by end of year 2024";
  const optionTitles = ["Yes, king of jeets", "No, just jewish"];
  const isPaused = false;
  const winningOption = null;
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/pumpdotfun_indian.jpeg";
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
