import {
  parseTweetIdFromUrl,
  extractPoolIdFromLinksArr,
  extractPoolIdFromUrl,
} from "../utils";

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

describe("extractPoolIdFromLinksArr", () => {
  it("should extract the first valid pool ID from an array of links", () => {
    const firstValidPoolId = "poolId1";
    const mockExtractFn = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error();
      })
      .mockImplementationOnce(() => firstValidPoolId)
      .mockImplementationOnce(() => "poolId2");

    const links = ["link1", "link2", "link3"];
    expect(extractPoolIdFromLinksArr(links, mockExtractFn)).toBe(
      firstValidPoolId,
    );
    expect(mockExtractFn).toHaveBeenCalledTimes(2);
  });

  it("should return null if no valid pool ID is found", () => {
    const mockExtractFn = jest.fn().mockImplementation(() => {
      throw new Error();
    });
    const links = ["link1", "link2", "link3"];
    expect(extractPoolIdFromLinksArr(links, mockExtractFn)).toBeNull();
    expect(mockExtractFn).toHaveBeenCalledTimes(3);
  });

  it("should handle an empty array", () => {
    const mockExtractFn = jest.fn();
    expect(extractPoolIdFromLinksArr([], mockExtractFn)).toBeNull();
    expect(mockExtractFn).not.toHaveBeenCalled();
  });

  it("should use the default extractPoolIdFromUrl function when no custom function is provided", () => {
    const validUrl = "https://www.degenmarkets.com/pools/abc123";
    const links = ["invalid1", validUrl, "invalid2"];
    expect(extractPoolIdFromLinksArr(links)).toBe(
      extractPoolIdFromUrl(validUrl),
    );
  });
});
