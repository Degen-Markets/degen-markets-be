import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";
import pools from "../src/solanaActions/pools.json";
import fs from "fs";

const pausePool = async (poolId: keyof typeof pools) => {
  const poolAccountKey = new PublicKey(poolId);
  await program.methods
    .setIsPaused(true)
    .accounts({
      poolAccount: poolAccountKey,
      admin: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
  const newPools = {
    ...pools,
    [poolId]: {
      ...pools[poolId],
      isPaused: true,
    },
  };
  fs.writeFileSync(
    `${process.cwd()}/src/solanaActions/pools.json`,
    JSON.stringify(newPools, null, 2),
  );
};

pausePool("JEfnt6hhJpQ44xZU2XG1MFAJ1coUyqjVFpMiyJarf4L");
