import * as anchor from "@coral-xyz/anchor";
import { getBytesFromHashedStr } from "../utils/cryptography";
import { program } from "../solanaActions/constants";

export const deriveOptionAccountKey = async (
  title: string,
  poolAccountKey: anchor.web3.PublicKey,
) => {
  const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(poolAccountKey.toString().concat(title))],
    program.programId,
  );
  console.log(`Derived option account is ${pda}`);
  return pda;
};
