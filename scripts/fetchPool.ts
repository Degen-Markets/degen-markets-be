import { program } from "./utils/constants";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const fetchPool = async (poolId: string) => {
  const poolAccountKey = new PublicKey(poolId);
  const poolAccount = await program.account.pool.fetch(poolAccountKey);
  console.log({
    ...poolAccount,
    value: Number(poolAccount.value) / LAMPORTS_PER_SOL,
  });
};

fetchPool("9o3t3HnhrzZrmsU69XYNqAq1x2KwdruXCtr8KeQ86jb5");
