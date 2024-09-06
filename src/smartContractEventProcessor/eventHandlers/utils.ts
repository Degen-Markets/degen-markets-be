import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const LAMPORTS_PER_SOL_BIGINT = BigInt(LAMPORTS_PER_SOL);

export function calculatePointsEarned(
  betValue: bigint,
  pointsEarnedPerSol: bigint,
): number {
  return Number((betValue * pointsEarnedPerSol) / LAMPORTS_PER_SOL_BIGINT);
}
