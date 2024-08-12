import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";

const concludePool = async (poolId: string, optionId: string) => {
  const optionAccountKey = new PublicKey(optionId);
  const poolAccountKey = new PublicKey(poolId);
  await program.methods
    .concludePool(optionAccountKey)
    .accounts({
      poolAccount: poolAccountKey,
      admin: adminAccount.publicKey,
    })
    .signers([adminAccount])
    .rpc();
};

concludePool("", "");
