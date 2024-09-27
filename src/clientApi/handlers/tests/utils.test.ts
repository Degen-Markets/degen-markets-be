import { parseTweetIdFromUrl, extractPoolIdFromTweetContent } from "../utils";

describe("parseTweetIdFromUrl", () => {
  it("should parse the tweet ID correctly", () => {
    const tweetId = Math.round(Math.random() * 100000000000000).toString(); // has to be digits
    const testCases = [
      `status/${tweetId}`,
      `status/${tweetId}/`,
      `status/${tweetId}?abc=1234`,
      `status/${tweetId}/?abc=1234`,
      `status/${tweetId}#abc`,
      `status/${tweetId}/#abc`,
    ];

    testCases.forEach((testCase) => {
      expect(parseTweetIdFromUrl(testCase)).toBe(tweetId);
    });
  });

  it("should throw an error for invalid tweet URL", () => {
    const invalidUrls = [
      // no `status/number`
      "invalidstring",
      "invalid/string",

      // no /status/
      "user/1234",

      // no number
      "status/abc",

      // no /status/numberstring/
      "status/1234abc",
    ];

    invalidUrls.forEach((url) => {
      expect(() => parseTweetIdFromUrl(url)).toThrow("Invalid tweet URL");
    });
  });
});

describe("extractPoolIdFromTweetContent", () => {
  it("should extract the pool ID correctly from a valid URL", () => {
    const poolId = "abc123";
    const content = `Check out this pool: degenmarkets.com/pools/${poolId}`;
    expect(extractPoolIdFromTweetContent(content)).toBe(poolId);
  });

  it("should extract the first pool ID when multiple valid URLs are present", () => {
    const firstPoolId = "abc123";
    const secondPoolId = "xyz789";
    const content = `First pool: degenmarkets.com/pools/${firstPoolId}\nSecond pool: degenmarkets.com/pools/${secondPoolId}`;
    expect(extractPoolIdFromTweetContent(content)).toBe(firstPoolId);
  });

  it("should throw an error for invalid URLs", () => {
    const invalidContents = [
      "Check out this pool: dgenmarkets.com/pools/abc123", // Typo in domain
      "Check out this pool: degenmarkets.com/pool/abc123", // Missing 's' in 'pools'
      "Check out this pool: degenmarkets.com/pools/", // Missing pool ID
      "Check out this pool: degenmarkets.com/pools/$sdf", // Invalid pool ID
    ];

    invalidContents.forEach((content) => {
      expect(() => extractPoolIdFromTweetContent(content)).toThrow(
        "Match not found",
      );
    });
  });
});
