import { convertSolToLamports } from "../../../lib/utils";

describe("convertSolToLamports", () => {
  const testCases = [
    { input: "1", expected: 1000000000n, description: "whole number" },
    { input: "0.1", expected: 100000000n, description: "one decimal" },
    { input: "0.001", expected: 1000000n, description: "three decimals" },
    {
      input: "1.234567899",
      expected: 1234567899n,
      description: "max decimals",
    },
    { input: "1,000", expected: 1000000000000n, description: "with comma" },
    { input: " 1.5 ", expected: 1500000000n, description: "with whitespace" },
    { input: "01.0", expected: 1000000000n, description: "leading zero" },
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`converts ${description} correctly`, () => {
      expect(convertSolToLamports(input)).toBe(expected);
    });
  });

  const invalidInputs = [
    { input: "abc", description: "letters" },
    { input: "1.2.3", description: "multiple decimals" },
    { input: "-1", description: "negative number" },
    { input: "1e5", description: "scientific notation" },
  ];

  invalidInputs.forEach(({ input, description }) => {
    it(`returns null for invalid input: ${description}`, () => {
      expect(convertSolToLamports(input)).toBeNull();
    });
  });

  it("handles empty decimal places", () => {
    expect(convertSolToLamports("1.")).toBe(1000000000n);
    expect(convertSolToLamports("0.")).toBe(0n);
  });

  it("throws error for undefined input", () => {
    expect(() => convertSolToLamports(undefined as unknown as string)).toThrow(
      "Error converting SOL to lamports",
    );
  });

  it("throws error for null input", () => {
    expect(() => convertSolToLamports(null as unknown as string)).toThrow(
      "Error converting SOL to lamports",
    );
  });
});
