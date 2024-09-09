import { calculatePointsEarned } from "../utils";

describe("calculatePointsEarned", () => {
  it("should calculate points earned correctly when bet value is above threshold", () => {
    const pointsEarnedPerSol = BigInt(100);
    const result1 = calculatePointsEarned(
      BigInt(1_000_000_000),
      pointsEarnedPerSol,
    );
    expect(result1).toBe(100); // 1 SOL * 100 points/SOL = 100 points

    const result2 = calculatePointsEarned(
      BigInt(500_000_000),
      pointsEarnedPerSol,
    );
    expect(result2).toBe(50); // 0.5 SOL * 100 points/SOL = 50 points
  });

  it("should return 0 points when bet value is below threshold", () => {
    const pointsEarnedPerSol = BigInt(100);
    const result3 = calculatePointsEarned(BigInt(100_000), pointsEarnedPerSol);
    expect(result3).toBe(0); // 0.0001 SOL * 100 points/SOL = 0.01 points, rounded down to 0

    const result4 = calculatePointsEarned(BigInt(200_000), pointsEarnedPerSol);
    expect(result4).toBe(0); // 0.0002 SOL * 100 points/SOL = 0.02 points, rounded down to 0
  });

  it("should calculate points earned correctly with different pointsPerSol values", () => {
    const betValue = BigInt(2_000_000_000); // 2 SOL

    const result1 = calculatePointsEarned(betValue, BigInt(100));
    const result2 = calculatePointsEarned(betValue, BigInt(200));
    const result3 = calculatePointsEarned(betValue, BigInt(50));

    expect(result1).toBe(200); // 2 SOL * 100 points/SOL = 200 points
    expect(result2).toBe(400); // 2 SOL * 200 points/SOL = 400 points
    expect(result3).toBe(100); // 2 SOL * 50 points/SOL = 100 points
  });
});
