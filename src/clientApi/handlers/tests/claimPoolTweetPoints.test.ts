import { APIGatewayProxyEventV2 } from "aws-lambda";
import claimPoolTweetPointsHandler from "../claimPoolTweetPoints";
import * as Utils from "../utils";
import PlayersService from "../../../players/service";
import { buildBadRequestError } from "../../../utils/httpResponses";
import * as TwitterUtils from "../../../utils/twitter";
import PoolsJson from "../../../solanaActions/pools.json";
import PoolSharingTweetsService from "../../../poolSharingTweets/service";
import PoolsService from "../../../pools/service";

const spiedParseTweetIdFromUrl = jest.spyOn(Utils, "parseTweetIdFromUrl");
const spiedGetPoolPageUrlFromPoolId = jest.spyOn(
  Utils,
  "getPoolPageUrlFromPoolId",
);

const mockPlayer = {
  address: "player123",
  points: 0,
  twitterUsername: null,
  twitterPfpUrl: null,
  twitterId: null,
};
const spiedGetPlayerByAddress = jest
  .spyOn(PlayersService, "getPlayerByAddress")
  .mockResolvedValue(mockPlayer);
const spiedChangePoints = jest
  .spyOn(PlayersService, "changePoints")
  .mockImplementation();

jest.mock("../../../solanaActions/pools.json", () => ({
  pool123: {},
}));
const mockPoolId = Object.keys(PoolsJson)[0];

const spiedFindTweetContentById = jest
  .spyOn(TwitterUtils, "findTweetContentById")
  .mockResolvedValue(
    `Check out this pool\n${Utils.getPoolPageUrlFromPoolId(mockPoolId)}`,
  );

const spiedFindByTweetId = jest
  .spyOn(PoolSharingTweetsService, "findByTweetId")
  .mockResolvedValue(null);
const spiedInsertNew = jest
  .spyOn(PoolSharingTweetsService, "insertNew")
  .mockImplementation();

const mockEventBody = {
  tweetUrl: "https://twitter.com/user/status/123456789",
  poolId: mockPoolId,
  playerAddress: mockPlayer.address,
};
const mockEvent = {
  body: JSON.stringify(mockEventBody),
} as APIGatewayProxyEventV2;
const tweetIdInMockEventBody = Utils.parseTweetIdFromUrl(
  mockEventBody.tweetUrl,
);

describe("claimPoolTweetPointsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a bad request when event body is invalid JSON", async () => {
    const invalidJsonEvent = {
      body: "{invalid json",
    } as APIGatewayProxyEventV2;
    const response = await claimPoolTweetPointsHandler(invalidJsonEvent);

    expect(response).toEqual(
      buildBadRequestError("Couldn't parse request body"),
    );
  });

  it("returns a bad request when required fields in body are missing or invalid", async () => {
    const requiredFields = ["tweetUrl", "poolId", "playerAddress"];
    const perfectBody = Object.fromEntries(
      requiredFields.map((field) => [field, ""]),
    );
    const testBodies = [
      {},
      // if one of the fields is missing
      ...requiredFields.map((field) => ({
        ...perfectBody,
        [field]: undefined,
      })),
      // if one of the fields is not a string
      ...requiredFields.map((field) => ({
        ...perfectBody,
        [field]: 123,
      })),
    ];

    testBodies.forEach(async (body) => {
      const event = {
        body: JSON.stringify(body),
      } as APIGatewayProxyEventV2;
      const response = await claimPoolTweetPointsHandler(event);

      expect(response).toEqual(
        buildBadRequestError("Missing required fields in request body"),
      );
    });
  });

  it("returns a bad request for invalid tweet URL", async () => {
    spiedParseTweetIdFromUrl.mockImplementationOnce(() => {
      throw new Error("Invalid tweet URL");
    });
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(response).toEqual(buildBadRequestError("Invalid tweet URL"));
  });

  it("returns a bad request for invalid pool ID", async () => {
    const invalidEvent = {
      body: JSON.stringify({
        ...mockEventBody,
        poolId: "invalidPoolId",
      }),
    } as APIGatewayProxyEventV2;
    const response = await claimPoolTweetPointsHandler(invalidEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(response).toEqual(buildBadRequestError("Invalid pool ID"));
  });

  it("returns a bad request for invalid player address", async () => {
    spiedGetPlayerByAddress.mockResolvedValueOnce(null);
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
    );
    expect(response).toEqual(buildBadRequestError("Invalid player address"));
  });

  it("returns a bad request when tweet has already been verified", async () => {
    spiedFindByTweetId.mockResolvedValueOnce({
      tweetId: "",
      pool: "",
      player: "",
    });
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
    );
    expect(spiedFindByTweetId).toHaveBeenCalledWith(tweetIdInMockEventBody);
    expect(response).toEqual(buildBadRequestError("Tweet already verified"));
  });

  it("returns a bad request when tweet is not found", async () => {
    spiedFindTweetContentById.mockResolvedValueOnce(null);
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
    );
    expect(spiedFindByTweetId).toHaveBeenCalledWith(tweetIdInMockEventBody);
    expect(spiedFindTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(response).toEqual(buildBadRequestError("Tweet not found"));
  });

  it("returns failure when tweet doesn't contain pool URL", async () => {
    spiedFindTweetContentById.mockResolvedValueOnce("A tweet without pool URL");
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
    );
    expect(spiedFindByTweetId).toHaveBeenCalledWith(tweetIdInMockEventBody);
    expect(spiedFindTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(spiedGetPoolPageUrlFromPoolId).toHaveBeenCalledWith(mockPoolId);
    expect(response).toEqual(
      buildBadRequestError("Tweet content doesn't contain pool page URL"),
    );
  });

  it("returns success when tweet contains pool URL", async () => {
    jest.spyOn(PoolsService, "getPoolByAddress").mockResolvedValueOnce({
      address: "",
      description: "",
      image: "",
      title: "",
      isPaused: false,
      value: "0",
      createdAt: new Date(),
    });

    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
    );
    expect(spiedFindByTweetId).toHaveBeenCalledWith(tweetIdInMockEventBody);
    expect(spiedFindTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(spiedGetPoolPageUrlFromPoolId).toHaveBeenCalledWith(mockPoolId);
    expect(spiedChangePoints).toHaveBeenCalledWith(
      mockEventBody.playerAddress,
      expect.any(Number),
    );
    expect(spiedInsertNew).toHaveBeenCalledWith({
      tweetId: tweetIdInMockEventBody,
      pool: mockEventBody.poolId,
      player: mockEventBody.playerAddress,
    });
    if (typeof response !== "object") {
      expect(typeof response).toBe("object");
      return;
    }
    expect(response.statusCode).toEqual(200);
    const parsedBody = JSON.parse(response.body || "{}");
    expect(parsedBody.message).toEqual(
      "Pool tweet points claimed successfully",
    );
    expect(parsedBody.pointsAwarded).toEqual(expect.any(Number));
    expect(parsedBody.pointsAwarded).toBeGreaterThan(0);
  });
});
