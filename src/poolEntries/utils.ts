import { PublicKey } from "@solana/web3.js";
import { programId } from "../solanaActions/constants";

export const deriveEntryAccountKey = (
  optionAccountKey: PublicKey,
  entrant: PublicKey,
) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [optionAccountKey.toBuffer(), entrant.toBuffer()],
    programId,
  );
  console.log(`Derived entry account is ${pda}`);
  return pda;
};
