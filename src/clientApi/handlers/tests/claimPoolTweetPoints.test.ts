import { APIGatewayProxyEventV2 } from "aws-lambda";
import claimPoolTweetPointsHandler from "../claimPoolTweetPoints";
import * as Utils from "../utils";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import * as TwitterUtils from "../../../utils/twitter";
import PoolsJson from "../../../solanaActions/pools.json";
import PoolSharingTweetsService from "../../../poolSharingTweets/service";

// This is a bad practice because `getMandatoryEnvValue` isn't a direct dependency of `saveTwitterProfile`.
// Ideally we only need to mock direct dependencies (otherwise it's a slippery slope). Here we're forced to
// mock `getMandatoryEnvValue` as `twitter-api-sdk` has a weird usage (`authClient` is shared statefully).
// Otherwise, mocking `TwitterUtils` (as we have done here) would have been enough.
jest.mock("../../../utils/getMandatoryEnvValue");

const spiedParseTweetIdFromUrl = jest.spyOn(Utils, "parseTweetIdFromUrl");
const spiedGetPoolPageUrlFromPoolId = jest.spyOn(
  Utils,
  "getPoolPageUrlFromPoolId",
);

jest.mock("../../../clients/DrizzleClient");
const mockDb = "mockDb";
jest.mocked(DrizzleClient.makeDb).mockResolvedValue(mockDb as any);

jest.mock("../../../players/service");
const MockedPlayersService = jest.mocked(PlayersService);
const mockPlayer = {
  address: "player123",
  points: 0,
  twitterUsername: null,
  twitterPfpUrl: null,
  twitterId: null,
};
MockedPlayersService.getPlayerByAddress.mockResolvedValue(mockPlayer);

jest.mock("../../../solanaActions/pools.json", () => ({
  pool123: {},
}));
const mockPoolId = Object.keys(PoolsJson)[0];

jest.mock("../../../utils/twitter");
const MockedTwitterUtils = jest.mocked(TwitterUtils);
MockedTwitterUtils.findTweetContentById.mockResolvedValue(
  `Check out this pool\n${Utils.getPoolPageUrlFromPoolId(mockPoolId)}`,
);

jest.mock("../../../poolSharingTweets/service");
const MockedPoolSharingTweetsService = jest.mocked(PoolSharingTweetsService);
MockedPoolSharingTweetsService.findByTweetId.mockResolvedValue(null);

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
    MockedPlayersService.getPlayerByAddress.mockResolvedValueOnce(null);
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(MockedPlayersService.getPlayerByAddress).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
    );
    expect(response).toEqual(buildBadRequestError("Invalid player address"));
  });

  it("returns a bad request when tweet has already been verified", async () => {
    MockedPoolSharingTweetsService.findByTweetId.mockResolvedValueOnce({
      tweetId: "",
      pool: "",
      player: "",
    });
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(MockedPlayersService.getPlayerByAddress).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
    );
    expect(MockedPoolSharingTweetsService.findByTweetId).toHaveBeenCalledWith(
      mockDb,
      tweetIdInMockEventBody,
    );
    expect(response).toEqual(buildBadRequestError("Tweet already verified"));
  });

  it("returns a bad request when tweet is not found", async () => {
    MockedTwitterUtils.findTweetContentById.mockResolvedValueOnce(null);
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(MockedPlayersService.getPlayerByAddress).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
    );
    expect(MockedPoolSharingTweetsService.findByTweetId).toHaveBeenCalledWith(
      mockDb,
      tweetIdInMockEventBody,
    );
    expect(MockedTwitterUtils.findTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(response).toEqual(buildBadRequestError("Tweet not found"));
  });

  it("returns failure when tweet doesn't contain pool URL", async () => {
    MockedTwitterUtils.findTweetContentById.mockResolvedValueOnce(
      "A tweet without pool URL",
    );
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(MockedPlayersService.getPlayerByAddress).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
    );
    expect(MockedPoolSharingTweetsService.findByTweetId).toHaveBeenCalledWith(
      mockDb,
      tweetIdInMockEventBody,
    );
    expect(MockedTwitterUtils.findTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(spiedGetPoolPageUrlFromPoolId).toHaveBeenCalledWith(mockPoolId);
    expect(response).toEqual(
      buildBadRequestError("Tweet content doesn't contain pool page URL"),
    );
  });

  it("returns success when tweet contains pool URL", async () => {
    const response = await claimPoolTweetPointsHandler(mockEvent);

    expect(spiedParseTweetIdFromUrl).toHaveBeenCalledWith(
      mockEventBody.tweetUrl,
    );
    expect(MockedPlayersService.getPlayerByAddress).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
    );
    expect(MockedPoolSharingTweetsService.findByTweetId).toHaveBeenCalledWith(
      mockDb,
      tweetIdInMockEventBody,
    );
    expect(MockedTwitterUtils.findTweetContentById).toHaveBeenCalledWith(
      tweetIdInMockEventBody,
    );
    expect(spiedGetPoolPageUrlFromPoolId).toHaveBeenCalledWith(mockPoolId);
    expect(MockedPlayersService.changePoints).toHaveBeenCalledWith(
      mockDb,
      mockEventBody.playerAddress,
      expect.any(Number),
    );
    expect(MockedPoolSharingTweetsService.insertNew).toHaveBeenCalledWith(
      mockDb,
      {
        tweetId: tweetIdInMockEventBody,
        pool: mockEventBody.poolId,
        player: mockEventBody.playerAddress,
      },
    );
    expect(response).toEqual(
      buildOkResponse("Pool tweet points claimed successfully"),
    );
  });
});
