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

fetchPool("HjGGCqYyp8ED2ipRLpFkZvwNcoRtSuySi7vpNeYeeKNz");
