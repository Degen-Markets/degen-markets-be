import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";

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

pausePool("7QTZY2trftoGQrn4hGYXPB7AHFHFzJHB9tXMZgnyKpe8");
