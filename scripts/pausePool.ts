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
};

pausePool("9o3t3HnhrzZrmsU69XYNqAq1x2KwdruXCtr8KeQ86jb5");
