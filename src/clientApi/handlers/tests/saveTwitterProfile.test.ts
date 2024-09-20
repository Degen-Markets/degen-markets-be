import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import PlayersService from "../../../players/service";
import saveTwitterProfile from "../saveTwitterProfile";
import * as TwitterUtils from "../../../utils/twitter";
import { findMyUser, TwitterResponse } from "twitter-api-sdk/dist/types";
import {
  buildBadRequestError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import { verifySignature } from "../../../utils/cryptography";
import { findHighResImageUrl } from "../utils";
import { PlayerEntity } from "../../../players/schema";

jest.mock("@aws-lambda-powertools/logger");

jest.mock("../../../utils/cryptography");
const mockedVerifySignature = jest
  .mocked(verifySignature)
  .mockReturnValue(true);

jest.mock("../../../utils/twitter");
const mockTwitterUser = {
  username: "rajgokal",
  profile_image_url:
    "https://pbs.twimg.com/profile_images/1793628589461798912/t0u2yVKg_normal.jpg",
  id: "1",
};
const MockedTwitterUtils = jest.mocked(TwitterUtils);
MockedTwitterUtils.findConnectedUser.mockResolvedValue({
  data: mockTwitterUser,
} as TwitterResponse<findMyUser>);

const mockEventBodyObj = {
  twitterCode: "twitterCode",
  signature: "mock_signature",
  address: "mock_address",
};
const mockEvent = {
  body: JSON.stringify(mockEventBodyObj),
} as APIGatewayProxyEventV2;

describe("saveTwitterProfile", () => {
  const mockedPlayer: PlayerEntity = {
    twitterUsername: mockTwitterUser.username,
    twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
    twitterId: mockTwitterUser.id,
    address: mockEventBodyObj.address,
    points: 0,
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns a bad request if the user's signature doesn't match their address", async () => {
    mockedVerifySignature.mockReturnValueOnce(false);
    const result: APIGatewayProxyResultV2 = await saveTwitterProfile(mockEvent);
    expect(mockedVerifySignature).toHaveBeenCalledWith(
      "mock_signature",
      "mock_address",
    );
    expect(result).toEqual(buildBadRequestError("This is not your address!"));
  });

  it("returns a bad request if the request body is missing required properties", async () => {
    const expectedResponse = buildBadRequestError(
      "Missing properties in request body",
    );

    const eventSansSignature = {
      body: JSON.stringify({
        twitterCode: "someCode",
        address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd",
      }),
    } as APIGatewayProxyEventV2;
    const result: APIGatewayProxyResultV2 =
      await saveTwitterProfile(eventSansSignature);
    expect(result).toEqual(expectedResponse);

    const eventSansTwitterCode = {
      body: JSON.stringify({
        signature: "someSignature",
        address: "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd",
      }),
    } as APIGatewayProxyEventV2;
    const resultSansTwitterCode: APIGatewayProxyResultV2 =
      await saveTwitterProfile(eventSansTwitterCode);
    expect(resultSansTwitterCode).toEqual(expectedResponse);

    const eventSansAddress = {
      body: JSON.stringify({
        twitterCode: "someCode",
        signature: "someSignature",
      }),
    } as APIGatewayProxyEventV2;
    const resultSansAddress: APIGatewayProxyResultV2 =
      await saveTwitterProfile(eventSansAddress);
    expect(resultSansAddress).toEqual(expectedResponse);
  });

  it("returns an error if twitter user is not found", async () => {
    MockedTwitterUtils.findConnectedUser.mockResolvedValueOnce({
      data: undefined,
    });

    const response = await saveTwitterProfile(mockEvent);
    expect(response).toEqual(buildBadRequestError("Invalid twitter user"));
  });

  it("returns an error if the twitter id was already used for a different player", async () => {
    jest
      .spyOn(PlayersService, "getPlayerByTwitterId")
      .mockResolvedValue(mockedPlayer);

    const response = await saveTwitterProfile(mockEvent);
    expect(response).toEqual(
      buildBadRequestError(
        "This user is already signed up with a different wallet!",
      ),
    );
  });

  it("adds a new user (with twitter points) if user doesn't exist in db yet", async () => {
    const mockInsert = jest.fn().mockResolvedValue(mockedPlayer);
    jest.spyOn(PlayersService, "getPlayerByTwitterId").mockResolvedValue(null);
    jest.spyOn(PlayersService, "getPlayerByAddress").mockResolvedValue(null);
    jest.spyOn(PlayersService, "insertNew").mockImplementation(mockInsert);

    const response = await saveTwitterProfile(mockEvent);
    const expectedTwitterProfile = {
      twitterUsername: mockTwitterUser.username,
      twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
      twitterId: mockTwitterUser.id,
    };

    expect(mockInsert).toHaveBeenCalledWith({
      address: "mock_address",
      points: expect.any(Number),
      ...expectedTwitterProfile,
    });
    expect(response).toEqual(buildOkResponse(mockedPlayer));
  });

  it("awards points if user already exists in db but without twitter linked", async () => {
    const existingPlayer: PlayerEntity = {
      address: mockEventBodyObj.address,
      points: 100,
      twitterUsername: null,
      twitterPfpUrl: null,
      twitterId: null,
    };
    jest
      .spyOn(PlayersService, "getPlayerByAddress")
      .mockResolvedValue(existingPlayer);
    jest.spyOn(PlayersService, "getPlayerByTwitterId").mockResolvedValue(null);
    const mockedChangePoints = jest.fn();
    jest
      .spyOn(PlayersService, "changePoints")
      .mockImplementation(mockedChangePoints);
    const mockedUpdateTwitterProfile = jest
      .fn()
      .mockResolvedValue(mockedPlayer);
    jest
      .spyOn(PlayersService, "updateTwitterProfile")
      .mockImplementation(mockedUpdateTwitterProfile);

    const response = await saveTwitterProfile(mockEvent);

    const expectedTwitterProfile = {
      twitterUsername: mockTwitterUser.username,
      twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
      twitterId: mockTwitterUser.id,
    };
    expect(mockedChangePoints).toHaveBeenCalledWith(
      existingPlayer.address,
      expect.any(Number),
    );
    expect(mockedUpdateTwitterProfile).toHaveBeenCalledWith(
      existingPlayer.address,
      expectedTwitterProfile,
    );
    expect(response).toEqual(buildOkResponse(mockedPlayer));
  });

  it("doesn't award points if user already exists in db with twitter linked", async () => {
    const existingPlayer: PlayerEntity = {
      address: mockEventBodyObj.address,
      points: 100,
      twitterUsername: "mock_username_2",
      // we currently internally only check if `twitterUsername` is set
      twitterPfpUrl: null,
      twitterId: null,
    };
    jest.spyOn(PlayersService, "getPlayerByTwitterId").mockResolvedValue(null);
    jest
      .spyOn(PlayersService, "getPlayerByAddress")
      .mockResolvedValue(existingPlayer);
    const mockedChangePoints = jest.fn();
    jest
      .spyOn(PlayersService, "changePoints")
      .mockImplementation(mockedChangePoints);
    const mockedUpdateTwitterProfile = jest
      .fn()
      .mockResolvedValue(existingPlayer);
    jest
      .spyOn(PlayersService, "updateTwitterProfile")
      .mockImplementation(mockedUpdateTwitterProfile);

    const response = await saveTwitterProfile(mockEvent);

    const expectedTwitterProfile = {
      twitterUsername: mockTwitterUser.username,
      twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
      twitterId: mockTwitterUser.id,
    };
    expect(mockedChangePoints).not.toHaveBeenCalled();
    expect(mockedUpdateTwitterProfile).toHaveBeenCalledWith(
      existingPlayer.address,
      expectedTwitterProfile,
    );
    expect(response).toEqual(buildOkResponse(existingPlayer));
  });
});
