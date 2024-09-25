import { program } from "./utils/constants";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const fetchPool = async (optionAddress: string) => {
  const optionAccountKey = new PublicKey(optionAddress);
  const optionAccount =
    await program.account.poolOption.fetch(optionAccountKey);
  console.log({
    ...optionAccount,
    value: Number(optionAccount.value),
  });
};

fetchPool("4dZyo12HZbEhfo3g5JyLxqUvGEGVsDHieB2VeyEqSTcV");
