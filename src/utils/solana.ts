import { LAMPORTS_PER_SOL_BIGINT } from "./constants";

/**
 * Safely converts SOL amount string to lamports BigInt
 * @param solAmount - Amount in SOL as string
 * @returns Amount in lamports as BigInt
 */
export const convertSolToLamports = (
  solAmount: string | number,
): bigint | null => {
  try {
    const cleanAmount = solAmount.toString().trim().replace(/,/g, "");

    if (!/^\d*\.?\d*$/.test(cleanAmount)) {
      return null;
    }

    const [whole = "0", decimal = ""] = cleanAmount.split(".");

    const wholeLamports = BigInt(whole) * LAMPORTS_PER_SOL_BIGINT;

    if (decimal) {
      // Pad with zeros to 9 decimal places
      const paddedDecimal = decimal.padEnd(9, "0").slice(0, 9);
      // Convert decimal part to lamports
      const decimalLamports = BigInt(paddedDecimal);
      return wholeLamports + decimalLamports;
    }

    return wholeLamports;
  } catch (e) {
    throw new Error(
      `Error converting SOL to lamports, error:${e}, solAmount: ${solAmount}`,
    );
  }
};

function validateInput(value: bigint | string): bigint {
  if (value === null || value === undefined) {
    throw new Error("Input cannot be null or undefined");
  }

  try {
    if (typeof value === "bigint") {
      return value;
    }

    if (typeof value === "string") {
      const cleanedValue = value.trim().replace(/,/g, "");

      if (!/^-?\d+(\.\d+)?$/.test(cleanedValue)) {
        throw new Error(`Invalid number format: ${value}`);
      }

      return BigInt(cleanedValue);
    }

    throw new Error(`Unsupported input type: ${typeof value}`);
  } catch (error) {
    throw new Error(
      `Invalid input: ${value} - ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function getAbsoluteValue(value: bigint): {
  isNegative: boolean;
  absValue: bigint;
} {
  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;
  return { isNegative, absValue };
}

function validateDecimalPlaces(decimalPlaces: number): void {
  if (decimalPlaces < 0 || decimalPlaces > 10) {
    throw new Error(`Decimal places must be between 0 and 10`);
  }
}

export function formatWithPrecision(
  value: bigint | string,
  divisor: bigint,
  decimalPlaces: number,
  showLabel: boolean = false,
): string {
  const validatedValue = validateInput(value);
  validateDecimalPlaces(decimalPlaces);

  if (divisor === 0n) {
    throw new Error("Division by zero is not allowed");
  }

  if (validatedValue === 0n) {
    return showLabel ? `0 SOL` : "0";
  }

  const { isNegative, absValue } = getAbsoluteValue(validatedValue);

  // Using absValue, simplifies mathematical operations (division, remainder)
  // by working with positive numbers. This prevents issues that can arise
  // from operating on negative numbers. We reintroduce the sign later to
  // ensure the output accurately reflects the original value without
  // risking output like "-1.-1 SOL". etc

  const integerPart = absValue / divisor;
  const remainder = absValue % divisor;

  const decimalMultiplier = BigInt(10 ** decimalPlaces);
  const decimalPart = (remainder * decimalMultiplier) / divisor;

  let formattedDecimalPart = decimalPart
    .toString()
    .padStart(decimalPlaces, "0")
    .replace(/0+$/, ""); // remove trailing zeros eg *.003001200 -> *.0030012 etc

  return `${isNegative ? "-" : ""}${integerPart}${
    formattedDecimalPart ? "." + formattedDecimalPart : ""
  }${showLabel ? ` SOL` : ""}`.trim();
}

export function formatSolBalance(
  value: bigint | string,
  showLabel: boolean = true,
): string {
  return formatWithPrecision(value, LAMPORTS_PER_SOL_BIGINT, 2, showLabel);
}
