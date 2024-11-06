import * as anchor from "@coral-xyz/anchor";
import { getBytesFromHashedStr } from "../utils/cryptography";
import { programId } from "../utils/constants";

export const derivePoolAccountKey = (
  title: string,
  creator: anchor.web3.PublicKey,
) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [getBytesFromHashedStr(title), creator.toBytes()],
    programId,
  );
  return pda;
};
