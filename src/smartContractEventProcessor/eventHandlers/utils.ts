import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

const LAMPORTS_PER_SOL_BN = new BN(LAMPORTS_PER_SOL); // bigger number divisions cause issues with Node + bn.js

export function calculatePointsEarned(
  betValue: BN,
  pointsEarnedPerSol: number,
): number {
  const pointShares = betValue.muln(pointsEarnedPerSol);
  if (pointShares.lt(LAMPORTS_PER_SOL_BN)) {
    return 0; // bn.js doesn't support decimals
  }
  return pointShares.div(LAMPORTS_PER_SOL_BN).toNumber();
}
