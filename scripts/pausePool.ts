import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";
import { deriveOptionAccountKey } from "../src/poolOptions/utils";

const pausePool = async (poolId: string) => {
  const poolAccountKey = new PublicKey(poolId);
  await program.methods
    .setIsPaused(true)
    .accounts({
      poolAccount: poolAccountKey,
      admin: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
  console.log(`pool paused ${poolId}`);
};

pausePool("HjGGCqYyp8ED2ipRLpFkZvwNcoRtSuySi7vpNeYeeKNz");
