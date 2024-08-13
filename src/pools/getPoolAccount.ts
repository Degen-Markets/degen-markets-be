import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { buildOkResponse } from "../utils/httpResponses";
import { buildNotFoundError } from "../utils/errors";
import { program } from "../solanaActions/constants";

const getPoolAccount = async (poolId: string) => {
  try {
    const poolAccountKey = new PublicKey(poolId);
    const poolAccount = await program.account.pool.fetch(poolAccountKey);
    return buildOkResponse({
      ...poolAccount,
      winningOption: poolAccount.winningOption.toString(),
      value: Number(poolAccount.value) / LAMPORTS_PER_SOL,
    });
  } catch (e) {
    return buildNotFoundError(`Pool not found with id: ${poolId}`);
  }
};

export default getPoolAccount;
