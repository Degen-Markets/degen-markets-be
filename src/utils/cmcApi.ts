export const tickerToCmcId = {
  BTC: 1,
  DOGE: 74,
  ETH: 1_027,
  SOL: 5_426,
  UNI: 7_083,
  AAVE: 7_278,
  FLOKI: 10_804,
  ARB: 11_841,
  RON: 14_101,
  APE: 18_876,
  BANANA: 18_998,
  LINK: 1_975,
  BONK: 23_095,
  BLUR: 23_121,
  PEPE: 24_478,
  dYdX: 28_324,
  MEME: 28_301,
  WIF: 28_752,
  JUP: 29_210,
  BODEN: 29_687,
  MFER: 30_226,
  PAC: 30_662,
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
