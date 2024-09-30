/**
 * Gets the high res version of twitter pfp
 * @param twitterImageUrl The original (low res) pfp url
 * @returns The high res pfp url
 */
export const findHighResImageUrl = (twitterImageUrl: string): string => {
  const lowResImageSuffix = "_normal";

  return twitterImageUrl.split(lowResImageSuffix).join("");
};

/**
 * Parses the tweet id from a tweet url
 * @param url The tweet url
 * @returns The tweet id
 */
export const parseTweetIdFromUrl = (url: string): string => {
  // We're not overcomplicating the tweet url regex. If it has status/number, it's valid enough.
  // Anyway, we are checking the tweet via twitter API, not via the tweet link sent in the request. So it's secure.
  const match = url.match(/status\/(\d+)\/?\b/);
  if (!match?.[1]) {
    throw new Error("Invalid tweet URL");
  }
  return match[1];
};

export function extractPoolIdFromTweetContent(content: string): string {
  const match = content.match(/degenmarkets\.com\/pools\/([a-zA-Z0-9]+)/);
  if (!match?.[1]) {
    throw new Error("Match not found");
  }
  return match[1];
}

export function extractPoolIdFromUrl(url: string): string {
  const match = url.match(
    /^https:\/\/www\.degenmarkets\.com\/pools\/([a-zA-Z0-9]+)/,
  );
  if (!match?.[1]) {
    throw new Error("Valid pool ID not found in URL");
  }
  return match[1];
}
