import * as anchor from "@coral-xyz/anchor";
import { getBytesFromHashedStr } from "../utils/cryptography";
import { programId } from "../utils/constants";

export const derivePoolAccountKey = (title: string) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(title)],
    programId,
  );
  console.log(`Derived pool account is ${pda}`);
  return pda;
};
