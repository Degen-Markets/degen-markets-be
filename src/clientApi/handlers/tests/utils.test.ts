import { getPoolPageUrlFromPoolId, parseTweetIdFromUrl } from "../utils";

describe("getPoolPageUrlFromPoolId", () => {
  it("should return the correct pool page URL", () => {
    const poolId = Math.random().toString();
    expect(getPoolPageUrlFromPoolId(poolId)).toBe(
      `degenmarkets.com/pools/${poolId}`,
    );
  });
});

describe("parseTweetIdFromUrl", () => {
  it("should parse the tweet ID correctly", () => {
    const tweetId = Math.round(Math.random() * 100000000000000).toString(); // has to be digits
    expect(parseTweetIdFromUrl(`status/${tweetId}`)).toBe(tweetId);
    expect(parseTweetIdFromUrl(`status/${tweetId}/`)).toBe(tweetId);
    expect(parseTweetIdFromUrl(`status/${tweetId}?abc=1234`)).toBe(tweetId);
    expect(parseTweetIdFromUrl(`status/${tweetId}/?abc=1234`)).toBe(tweetId);
    expect(parseTweetIdFromUrl(`status/${tweetId}#abc`)).toBe(tweetId);
    expect(parseTweetIdFromUrl(`status/${tweetId}/#abc`)).toBe(tweetId);
  });

  it("should throw an error for invalid tweet URL", () => {
    // no `status/number`
    expect(() => parseTweetIdFromUrl("invalidstring")).toThrow(
      "Invalid tweet URL",
    );
    expect(() => parseTweetIdFromUrl("invalid/string")).toThrow(
      "Invalid tweet URL",
    );

    // no /status/
    expect(() => parseTweetIdFromUrl("user/1234")).toThrow("Invalid tweet URL");

    // no number
    expect(() => parseTweetIdFromUrl("status/abc")).toThrow(
      "Invalid tweet URL",
    );

    // no /status/numberstring/
    expect(() => parseTweetIdFromUrl("status/1234abc")).toThrow(
      "Invalid tweet URL",
    );
  });
});
