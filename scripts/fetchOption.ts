import { program } from "./utils/constants";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { deriveOptionAccountKey } from "../src/poolOptions/utils";

const fetchOption = async (optionAddress: string) => {
  const optionAccountKey = new PublicKey(optionAddress);
  const optionAccount =
    await program.account.poolOption.fetch(optionAccountKey);
  console.log({
    ...optionAccount,
    value: Number(optionAccount.value),
  });
};

fetchOption("FfBcXG9qwjXW2Fzmo99sAw6VH6d8AvBvCgXZWhVQETZq");
