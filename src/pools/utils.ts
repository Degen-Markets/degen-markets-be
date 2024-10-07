import * as anchor from "@coral-xyz/anchor";
import { program } from "../solanaActions/constants";
import { getBytesFromHashedStr } from "../utils/cryptography";

export const derivePoolAccountKey = (title: string) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(title)],
    program.programId,
  );
  console.log(`Derived pool account is ${pda}`);
  return pda;
};
