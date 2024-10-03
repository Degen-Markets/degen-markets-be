import * as anchor from "@coral-xyz/anchor";
import { program } from "./constants";
import { getOptionTitleHash } from "../../src/utils/cryptography";

import { deriveOptionAccountKey } from "../../src/poolOptions/utils";

export const createOption = async (
  optionTitle: string,
  keypair: anchor.web3.Keypair,
  poolAccountKey: anchor.web3.PublicKey,
) => {
  const optionAccountKey = await deriveOptionAccountKey(
    optionTitle,
    poolAccountKey,
  );
  await program.methods
    .createOption(
      optionTitle,
      getOptionTitleHash(poolAccountKey, optionTitle) as unknown as number[],
    )
    .accountsPartial({
      optionAccount: optionAccountKey,
      poolAccount: poolAccountKey,
      admin: keypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();
  console.log(`Option created ${optionAccountKey}`);
  return optionAccountKey;
};
