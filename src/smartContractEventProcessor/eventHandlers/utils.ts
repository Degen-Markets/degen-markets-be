import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

export function calculatePointsEarned(
  betValue: BN,
  pointsEarnedPerSol: number,
): number {
  const pointShares = betValue.muln(pointsEarnedPerSol);
  if (pointShares.lt(new BN(LAMPORTS_PER_SOL))) {
    return 0; // bn.js doesn't support decimals
  }
  return betValue.muln(pointsEarnedPerSol).divn(LAMPORTS_PER_SOL).toNumber();
}
