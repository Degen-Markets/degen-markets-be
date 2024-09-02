import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";

const pausePool = async (poolId: string, optionId: string) => {
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
};

pausePool(
  "9o3t3HnhrzZrmsU69XYNqAq1x2KwdruXCtr8KeQ86jb5",
  "DCKjyxN4rr9Tk4mbTj9wLcWLXkpCkDRibvx1V7SwyqEb",
);
