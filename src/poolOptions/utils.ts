import * as anchor from "@coral-xyz/anchor";
import { getBytesFromHashedStr } from "../utils/cryptography";
import { programId } from "../utils/constants";

export const deriveOptionAccountKey = (
  title: string,
  poolAccountKey: anchor.web3.PublicKey,
) => {
  const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(poolAccountKey.toString().concat(title))],
    programId,
  );
  console.log(`Derived option account is ${pda}`);
  return pda;
};
