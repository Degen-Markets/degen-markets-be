import { parseTweetIdFromUrl, extractPoolIdFromUrl } from "../utils";

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

describe("extractPoolIdFromUrl", () => {
  it("should extract the pool ID correctly from a valid URL", () => {
    const poolId = "abc123";
    const url = `https://www.degenmarkets.com/pools/${poolId}`;
    expect(extractPoolIdFromUrl(url)).toBe(poolId);
  });

  it("should throw an error for invalid URLs", () => {
    const invalidUrls = [
      "degenmarkets.com/pools/abc123", // missing https://www
      "https://www.dgenmarkets.com/pools/abc123", // Typo in domain
      "https://degenmarkets.com/pool/abc123", // Invalid path
      "https://degenmarkets.com/pools/", // Missing pool ID
      "https://degenmarkets.com/pools/$sdf", // Invalid pool ID
    ];

    invalidUrls.forEach((content) => {
      expect(() => extractPoolIdFromUrl(content)).toThrow(
        "Valid pool ID not found in URL",
      );
    });
  });
});
