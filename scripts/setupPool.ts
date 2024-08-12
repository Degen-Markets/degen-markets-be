import pools from "../src/solanaActions/pools.json";
import fs from "fs";
import { adminAccount } from "./utils/constants";
import { createPool, derivePoolAccountKey } from "./utils/pools";
import { createOption, deriveOptionAccountKey } from "./utils/options";

const main = async () => {
  const title = `Who will be the first to mention "crypto" on tonight's interview?`;
  const optionTitles = ["Based Trump", "Daddy Musk", "Both pu$$ies"];
  const imageUrl =
    "https://degen-markets-static.s3.eu-west-1.amazonaws.com/trump_vs_elon.png";
  const poolAccountKey = await derivePoolAccountKey(title);
  // const poolAccountKey = await createPool(title, adminAccount);
  const optionAccountKeys = await Promise.all(
    optionTitles.map((optionTitle) => {
      return deriveOptionAccountKey(optionTitle, poolAccountKey);
      // return createOption(optionTitle, adminAccount, poolAccountKey);
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
