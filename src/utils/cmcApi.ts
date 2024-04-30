export const tickerToCmcId = {
  BTC: 1,
  DOGE: 74,
  ETH: 1_027,
  SOL: 5_426,
  FLOKI: 10_804,
  PEPE: 24_478,
  WIF: 28_752,
  ARB: 11_841,
};

export const getCmcId = (ticker: string): number => {
  // @ts-ignore-next-line
  const cmcId = tickerToCmcId[ticker] as unknown;
  if (typeof cmcId === "number") {
    return cmcId;
  } else {
    return tickerToCmcId["BTC"];
  }
};
