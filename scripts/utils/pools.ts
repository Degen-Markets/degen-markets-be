import { program } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import { derivePoolAccountKey } from "../../src/pools/utils";
import { getTitleHash } from "../../src/utils/cryptography";

export const createPool = async (
  title: string,
  keypair: anchor.web3.Keypair,
  imageUrl: string,
  description: string,
) => {
  const poolAccountKey = derivePoolAccountKey(title);
  await program.methods
    .createPool(title, getTitleHash(title), imageUrl, description)
    .accounts({
      poolAccount: poolAccountKey,
      admin: keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();
  console.log(`Pool created`);
  return poolAccountKey;
};
