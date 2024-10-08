import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";

const setWinningOption = async (poolId: string, optionId: string) => {
  const optionAccountKey = new PublicKey(optionId);
  const poolAccountKey = new PublicKey(poolId);
  await program.methods
    .setWinningOption(optionAccountKey)
    .accounts({
      poolAccount: poolAccountKey,
      admin: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
  console.log(`Winner for pool ${poolId} set to option ${optionId}`);
};

setWinningOption(
  "HjGGCqYyp8ED2ipRLpFkZvwNcoRtSuySi7vpNeYeeKNz",
  "FfBcXG9qwjXW2Fzmo99sAw6VH6d8AvBvCgXZWhVQETZq",
);
