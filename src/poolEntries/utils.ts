import { PublicKey } from "@solana/web3.js";

import { programId } from "../utils/constants";

export const deriveEntryAccountKey = (
  optionAccountKey: PublicKey,
  entrant: PublicKey,
) => {
  const [pda] = PublicKey.findProgramAddressSync(
    [optionAccountKey.toBuffer(), entrant.toBuffer()],
    programId,
  );
  return pda;
};
