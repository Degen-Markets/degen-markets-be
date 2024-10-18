import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getPlayerByIdHandler } from "../players";
import PlayersService from "../../../players/service";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
} from "../../../utils/httpResponses";
import * as TwitterUtils from "../../../utils/twitter";

const mockPlayerId = "mockPlayerId";

const mockEvent = {
  pathParameters: {
    id: mockPlayerId,
  },
} as unknown as APIGatewayProxyEventV2;

const mockPlayer = {
  address: mockPlayerId,
  points: 100,
  twitterUsername: "mockTwitterUsername",
  twitterPfpUrl: "mockTwitterPfpUrl",
  twitterId: "mockTwitterId",
};
const spiedGetPlayerByAddress = jest
  .spyOn(PlayersService, "getPlayerByAddress")
  .mockResolvedValue(mockPlayer);

const mockUpdatedTwitterInfo = {
  twitterId: "",
  twitterUsername: "newMockTwitterUsername",
  twitterPfpUrl: "newMockTwitterPfpUrl",
};
const spiedFindUserById = jest
  .spyOn(TwitterUtils, "findUserById")
  .mockResolvedValue(mockUpdatedTwitterInfo);

const updatedPlayer = {
  ...mockPlayer,
  ...mockUpdatedTwitterInfo,
};
const spiedUpdateTwitterProfile = jest
  .spyOn(PlayersService, "updateTwitterProfile")
  .mockResolvedValue(updatedPlayer);

describe("getPlayerByIdHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a Bad Request error for missing id parameter", async () => {
    const badMockEvent: APIGatewayProxyEventV2 = {
      pathParameters: {},
    } as any;

    const response = await getPlayerByIdHandler(badMockEvent);
    expect(response).toEqual(buildBadRequestError("Player ID is required"));
  });

  it("returns a 404 error when player not found", async () => {
    spiedGetPlayerByAddress.mockResolvedValueOnce(null);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(mockPlayerId);
    expect(response).toEqual(buildNotFoundError("Player not found"));
  });

  it("returns player directly if no twitterId", async () => {
    const mockPlayerWithoutTwitterId = {
      ...mockPlayer,
      twitterId: null, // we don't really check the other fields (twitterUsername, twitterPfpUrl) in this controller
    };
    spiedGetPlayerByAddress.mockResolvedValueOnce(mockPlayerWithoutTwitterId);

    const response = await getPlayerByIdHandler(mockEvent);

    expect(spiedGetPlayerByAddress).toHaveBeenCalledWith(mockPlayerId);
    expect(spiedFindUserById).not.toHaveBeenCalled();
    expect(response).toEqual(buildOkResponse(mockPlayerWithoutTwitterId));
  });

  it("returns outdated player if twitterId exists, but couldn't be refreshed", async () => {
    spiedFindUserById.mockResolvedValueOnce(null);
    const response = await getPlayerByIdHandler(mockEvent);

    expect(spiedFindUserById).toHaveBeenCalledWith(mockPlayer.twitterId);
    expect(spiedUpdateTwitterProfile).not.toHaveBeenCalled();
    expect(response).toEqual(buildOkResponse(mockPlayer));
  });

  it("returns outdated player if twitterId exists, was refreshed, but couldn't be synced in database", async () => {
    spiedUpdateTwitterProfile.mockImplementationOnce(() => {
      throw new Error();
    });
    const response = await getPlayerByIdHandler(mockEvent);

    expect(spiedUpdateTwitterProfile).toHaveBeenCalledWith(
      mockPlayerId,
      mockUpdatedTwitterInfo,
    );
    expect(response).toEqual(buildOkResponse(mockPlayer));
  });

  it("returns updated player if twitterId exists, was refreshed, and was synced in database", async () => {
    const response = await getPlayerByIdHandler(mockEvent);
    expect(response).toEqual(buildOkResponse(updatedPlayer));
  });
});
