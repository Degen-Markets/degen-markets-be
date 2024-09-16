/**
 * Gets the high res version of twitter pfp
 * @param twitterImageUrl The original (low res) pfp url
 * @returns
 */
export const findHighResImageUrl = (twitterImageUrl: string): string => {
  const lowResImageSuffix = "_normal";

  return twitterImageUrl.split(lowResImageSuffix).join("");
};
