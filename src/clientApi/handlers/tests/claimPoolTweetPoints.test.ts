import { APIGatewayProxyEventV2 } from "aws-lambda";
import claimPoolTweetPointsHandler from "../claimPoolTweetPoints";
import * as Utils from "../utils";
import PlayersService from "../../../players/service";
import { buildBadRequestError } from "../../../utils/httpResponses";
import * as TwitterUtils from "../../../utils/twitter";
import PoolSharingTweetsService from "../../../poolSharingTweets/service";
import PoolsService from "../../../pools/service";

const mockEventBody = {
  tweetUrl: "https://twitter.com/user/status/123456789",
};
const mockEvent = {
  body: JSON.stringify(mockEventBody),
} as APIGatewayProxyEventV2;
const tweetIdInMockEventBody = Utils.parseTweetIdFromUrl(
  mockEventBody.tweetUrl,
);

const spiedParseTweetIdFromUrl = jest.spyOn(Utils, "parseTweetIdFromUrl");

const mockTweet = {
  content: "Mock tweet content",
  authorId: "mockTwitterId",
  links: ["link1", "link2"],
};

const spiedFindTweetById = jest
  .spyOn(TwitterUtils, "findTweetById")
  .mockResolvedValue(mockTweet);

const mockPoolId = "mockPoolId";
const spiedGetPoolIdFromLinksArr = jest
  .spyOn(Utils, "getPoolIdFromLinksArr")
  .mockReturnValue(mockPoolId);

const spiedGetPoolByAddress = jest
  .spyOn(PoolsService, "getPoolByAddress")
  .mockResolvedValue({
    // pool value is never used by the handler. Pool just needs to exist
    address: "",
    description: "",
    image: "",
    title: "",
    isPaused: false,
    value: "0",
    createdAt: new Date(),
  });

const mockPlayer = {
  address: "player123",
  points: 0,
  twitterUsername: null,
  twitterPfpUrl: null,
  twitterId: mockTweet.authorId,
};
const spiedGetPlayerByTwitterId = jest
  .spyOn(PlayersService, "getPlayerByTwitterId")
  .mockResolvedValue(mockPlayer);

const spiedFindClaimedTweetByTweetId = jest
  .spyOn(PoolSharingTweetsService, "findByTweetId")
  .mockResolvedValue(null);

const spiedChangePoints = jest
  .spyOn(PlayersService, "changePoints")
  .mockImplementation();

const spiedInsertNew = jest
  .spyOn(PoolSharingTweetsService, "insertNew")
  .mockImplementation();

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
    const requiredFields = ["tweetUrl"];
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
        buildBadRequestError("Missing required field in request body"),
      );
    });
  });

  it("returns a bad request for invalid tweet URL", async () => {
    spiedParseTweetIdFromUrl.mockImplementationOnce(() => {
      throw new Error();
    });
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(response).toEqual(buildBadRequestError("Invalid tweet URL"));
  });

  it("returns a bad request when tweet has already been claimed", async () => {
    spiedFindClaimedTweetByTweetId.mockResolvedValueOnce({
      // we just need a non null value to be returned
      tweetId: "",
      pool: "",
      player: "",
    });

    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedFindClaimedTweetByTweetId).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(response).toEqual(buildBadRequestError("Tweet already claimed"));
  });

  it("returns a bad request when tweet is not found", async () => {
    spiedFindTweetById.mockResolvedValueOnce(null);
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedFindTweetById).toHaveBeenCalledWith(tweetIdInMockEventBody);
    expect(response).toEqual(buildBadRequestError("Tweet not found"));
  });

  it("returns a bad request when pool ID cannot be extracted from tweet links array", async () => {
    spiedGetPoolIdFromLinksArr.mockReturnValueOnce(null);

    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedGetPoolIdFromLinksArr).toHaveBeenCalledWith(mockTweet.links);
    expect(response).toEqual(
      buildBadRequestError("Tweet content doesn't satisfy requirement"),
    );
  });

  it("returns a bad request when extracted pool ID is not found in DB", async () => {
    spiedGetPoolByAddress.mockResolvedValueOnce(null);

    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedGetPoolByAddress).toHaveBeenCalledWith(mockPoolId);
    expect(response).toEqual(buildBadRequestError("Invalid pool ID in tweet"));
  });

  it("returns a bad request when author for the given tweet is not found in players DB", async () => {
    spiedGetPlayerByTwitterId.mockResolvedValueOnce(null);

    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedGetPlayerByTwitterId).toHaveBeenCalledWith(mockTweet.authorId);
    expect(response).toEqual(
      buildBadRequestError("Tweet author isn't a registered player"),
    );
  });

  it("returns success when tweet contains valid pool URL", async () => {
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedChangePoints).toHaveBeenCalledWith(
      mockPlayer.address,
      expect.any(Number),
    );
    expect(spiedInsertNew).toHaveBeenCalledWith({
      tweetId: tweetIdInMockEventBody,
      pool: mockPoolId,
      player: mockPlayer.address,
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
    expect(parsedBody.authorUsername).toEqual(mockPlayer.twitterUsername);
  });
});
