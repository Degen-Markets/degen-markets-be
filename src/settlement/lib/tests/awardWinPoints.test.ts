import { UUID } from "crypto";
import { utils } from "../awardWinPoints";
import * as PlayerService from "../../../players/PlayerService";
import { BetEntity } from "../../../bets/BetEntity";

describe("getSuccessfulAndFailedAwardBetIds", () => {
  type WinPointAwardTrials = { betId: UUID; success: boolean }[];
  it("splits into separate groups correctly", () => {
    const winPointAwardTrials: WinPointAwardTrials = [
      { betId: "0xaaaa-aaaa-aaaa-aaaa-aaaa", success: true },
      { betId: "0xbbbb-bbbb-bbbb-bbbb-bbbb", success: false },
      { betId: "0xcccc-cccc-cccc-cccc-cccc", success: true },
    ];

    const [successBetIds, failedBetIds] =
      utils.getAwardBetIdsFilteredBySuccessOrFail(winPointAwardTrials);
    expect(successBetIds).toEqual([
      winPointAwardTrials[0].betId,
      winPointAwardTrials[2].betId,
    ]);
    expect(failedBetIds).toEqual([winPointAwardTrials[1].betId]);
  });

  it("returns empty arrays for empty input", () => {
    const winPointAwardTrials: WinPointAwardTrials = [];
    const [successBetIds, failedBetIds] =
      utils.getAwardBetIdsFilteredBySuccessOrFail(winPointAwardTrials);
    expect(successBetIds).toEqual([]);
    expect(failedBetIds).toEqual([]);
  });

  it("handles all successful entries", () => {
    const winPointAwardTrials: WinPointAwardTrials = [
      { betId: "0xdddd-dddd-dddd-dddd-dddd", success: true },
      { betId: "0xeeee-eeee-eeee-eeee-eeee", success: true },
    ];
    const [successBetIds, failedBetIds] =
      utils.getAwardBetIdsFilteredBySuccessOrFail(winPointAwardTrials);
    expect(successBetIds).toEqual([
      winPointAwardTrials[0].betId,
      winPointAwardTrials[1].betId,
    ]);
    expect(failedBetIds).toEqual([]);
  });

  it("handles all failed entries", () => {
    const winPointAwardTrials: WinPointAwardTrials = [
      { betId: "0xffff-ffff-ffff-ffff-ffff", success: false },
      { betId: "0xgggg-gggg-gggg-gggg-gggg", success: false },
    ];
    const [successBetIds, failedBetIds] =
      utils.getAwardBetIdsFilteredBySuccessOrFail(winPointAwardTrials);
    expect(successBetIds).toEqual([]);
    expect(failedBetIds).toEqual([
      winPointAwardTrials[0].betId,
      winPointAwardTrials[1].betId,
    ]);
  });
});

describe("tryAwardWinPointsToBet", () => {
  jest.mock("../../../players/PlayerService");
  const spiedChangePoints = jest.spyOn(PlayerService, "changePoints");

  it("expects the bet to already have a winner", async () => {
    const bet: BetEntity = {
      id: "aaaa-aaaa-aaaa-aaaa-aaaa",
      type: "abc",
      creator: "0xabc",
      creationTimestamp: 123,
      acceptor: null,
      acceptanceTimestamp: 123,
      ticker: "abc",
      metric: "abc",
      isBetOnUp: true,
      expirationTimestamp: 123,
      value: 123,
      currency: "abc",
      startingMetricValue: null,
      endingMetricValue: null,
      winner: null,
      winTimestamp: null,
      isWithdrawn: false,
      isPaid: true,
      withdrawalTimestamp: null,
      strikePriceCreator: null,
      strikePriceAcceptor: null,
      chain: null,
    };

    await expect(
      utils.tryAwardWinPointsToBet(bet, {
        ethUsdVal: 1,
        pointPerUsdForWonBet: 1,
      }),
    ).rejects.toThrow(
      `Bet doesn't have a winner set in database ${JSON.stringify({ bet })}`,
    );
  });

  // TODO: Add more tests
});
