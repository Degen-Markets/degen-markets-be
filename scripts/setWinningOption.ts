import pools from "../src/solanaActions/pools.json";
import { adminAccount, program } from "./utils/constants";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

const setWinningOption = async (
  poolId: keyof typeof pools,
  optionId: string,
) => {
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
  const newPools = {
    ...pools,
    [poolId]: {
      ...pools[poolId],
      winningOption: optionId,
    },
  };
  fs.writeFileSync(
    `${process.cwd()}/src/solanaActions/pools.json`,
    JSON.stringify(newPools, null, 2),
  );
};

setWinningOption(
  "FhUW3K3Kv3R5g7uSZK1adrzYV2ff7q3QeKCusdBey1RP",
  "BkftGEJ9GqJste5NEW8eVdhn8Uvn1nKBr5qphXZutGV5",
);
