import * as dotenv from "dotenv";
dotenv.config();
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import saveTwitterProfile from "../saveTwitterProfile";
import * as TwitterUtils from "../../../utils/twitter";
import { findMyUser, TwitterResponse } from "twitter-api-sdk/dist/types";
import {
  buildErrorResponse,
  buildOkResponse,
} from "../../../utils/httpResponses";
import { buildBadRequestError } from "../../../utils/errors";
import { verifySignature } from "../../../utils/cryptography";
import { findHighResImageUrl } from "../utils";
import { PlayerEntity } from "../../../players/types";

jest.mock("@aws-lambda-powertools/logger");

// This is a bad practice because `getMandatoryEnvValue` isn't a direct dependency of `saveTwitterProfile`.
// Ideally we only need to mock direct dependencies (otherwise it's a slippery slope). Here we're forced to
// mock `getMandatoryEnvValue` as `twitter-api-sdk` has a weird usage (`authClient` is shared statefully).
// Otherwise, mocking `TwitterUtils` (as we have done here) would have been enough.
jest.mock("../../../utils/getMandatoryEnvValue");

jest.mock("../../../clients/DrizzleClient");
const mockDb = {} as any;
jest.mocked(DrizzleClient.makeDb).mockResolvedValue(mockDb);

jest.mock("../../../utils/cryptography");
const mockedVerifySignature = jest.mocked(verifySignature);

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

jest.mock("../../../players/service");
const MockedPlayersService = jest.mocked(PlayersService);

describe("saveTwitterProfile", () => {
  it("returns a bad request if the user's signature doesn't match their address", async () => {
    const event = {
      body: JSON.stringify({
        twitterCode: "twitterCode",
        signature: "mock_signature",
        address: "mock_address",
      }),
    } as APIGatewayProxyEventV2;

    mockedVerifySignature.mockReturnValueOnce(false);
    const result: APIGatewayProxyResultV2 = await saveTwitterProfile(event);
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
    mockedVerifySignature.mockReturnValueOnce(true);
    MockedTwitterUtils.findConnectedUser.mockResolvedValueOnce({
      data: undefined,
    });

    const event = {
      body: JSON.stringify({
        twitterCode: "mock_twitterCode",
        signature: "mock_signature",
        address: "mock_address",
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveTwitterProfile(event);
    expect(response).toEqual(buildErrorResponse("Invalid twitter user"));
  });

  it("handles the case where user doesn't exist in db yet", async () => {
    mockedVerifySignature.mockReturnValueOnce(true);
    MockedPlayersService.getPlayerById.mockResolvedValueOnce(null);

    const event = {
      body: JSON.stringify({
        twitterCode: "mock_twitterCode",
        signature: "mock_signature",
        address: "mock_address",
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveTwitterProfile(event);

    const expectedTwitterProfile = {
      twitterUsername: mockTwitterUser.username,
      twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
      twitterId: mockTwitterUser.id,
    };
    expect(MockedPlayersService.insertNew).toHaveBeenCalledWith(mockDb, {
      address: "mock_address",
      points: expect.any(Number),
      ...expectedTwitterProfile,
    });
    expect(response).toEqual(buildOkResponse(expectedTwitterProfile));
  });

  it("handles the case where user already exists in db", async () => {
    mockedVerifySignature.mockReturnValueOnce(true);
    const existingPlayer: PlayerEntity = {
      address: "mock_address",
      points: 100,
      twitterUsername: null,
      twitterPfpUrl: null,
      twitterId: null,
    };
    MockedPlayersService.getPlayerById.mockResolvedValueOnce(existingPlayer);

    const event = {
      body: JSON.stringify({
        twitterCode: "mock_twitterCode",
        signature: "mock_signature",
        address: existingPlayer.address,
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveTwitterProfile(event);

    const expectedTwitterProfile = {
      twitterUsername: mockTwitterUser.username,
      twitterPfpUrl: findHighResImageUrl(mockTwitterUser.profile_image_url),
      twitterId: mockTwitterUser.id,
    };
    expect(MockedPlayersService.changePoints).toHaveBeenCalledWith(
      mockDb,
      existingPlayer.address,
      expect.any(Number),
    );
    expect(MockedPlayersService.updateTwitterProfile).toHaveBeenCalledWith(
      mockDb,
      existingPlayer.address,
      expectedTwitterProfile,
    );
    expect(response).toEqual(buildOkResponse(expectedTwitterProfile));
  });
});
