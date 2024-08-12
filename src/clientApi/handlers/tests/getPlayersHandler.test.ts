import getPlayersHandler from "../getPlayersHandler";
import * as PlayerService from "../../../players/PlayerService";
import { buildBadRequestError } from "../../../utils/errors";
import { buildOkResponse } from "../../../utils/httpResponses";
import getParamToListPlayersFromQs from "../utils/getParamToListPlayersFromQs";
import { Logger } from "@aws-lambda-powertools/logger";
import { createApiGwEvent } from "./utils/createEvent";

jest.mock("../../../players/PlayerService");
const spiedFindAllPlayers = jest.spyOn(PlayerService, "findAllPlayers");

jest.mock("../utils/getParamToListPlayersFromQs");
const mockedGetParamToListPlayersFromQs = jest.mocked(
  getParamToListPlayersFromQs,
);

jest.mock("@aws-lambda-powertools/logger");

describe("getPlayersHandler", () => {
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    logger = jest.mocked(Logger).mock.instances[0] as jest.Mocked<Logger>;
  });

  it("should return a successful response with player data", async () => {
    // inputs
    const queryStringParameters = { someParam: "value" };
    const event = createApiGwEvent({ queryStringParameters });

    // Mocks
    const paramToListPlayers = { limit: 2, offset: 234 };
    mockedGetParamToListPlayersFromQs.mockReturnValueOnce(paramToListPlayers);

    const playersListArr: Awaited<
      ReturnType<typeof PlayerService.findAllPlayers>
    > = [
      {
        address: "0xabc",
        betCount: 4,
        winCount: 2,
        points: 10,
        chain: "base",
        name: null,
        avatarUrl: null,
      },
    ];
    spiedFindAllPlayers.mockResolvedValueOnce(playersListArr);

    // call the fn
    const response = await getPlayersHandler(event);

    // expects
    expect(logger.info).toHaveBeenCalledWith(
      `fetching players with querystring params: ${JSON.stringify(queryStringParameters)}`,
    );
    expect(mockedGetParamToListPlayersFromQs).toHaveBeenCalledWith(
      queryStringParameters,
      expect.any(Object),
    );
    expect(PlayerService.findAllPlayers).toHaveBeenCalledWith(
      paramToListPlayers,
    );
    logger.info(
      `Successfully fetched players for qs=${JSON.stringify(queryStringParameters)}`,
    );
    expect(response).toEqual(buildOkResponse(playersListArr));
  });

  it("should return a bad request error for invalid query string parameters", async () => {
    // inputs
    const queryStringParameters = { someParam: "invalidValue" };
    const event = createApiGwEvent({
      queryStringParameters,
    });

    // Mocks
    const errMsg = "Bad query string";
    mockedGetParamToListPlayersFromQs.mockImplementationOnce(() => {
      throw new Error(errMsg);
    });

    // call the fn
    const response = await getPlayersHandler(event);

    // expects
    expect(logger.info).toHaveBeenCalledWith(
      `fetching players with querystring params: ${JSON.stringify(queryStringParameters)}`,
    );
    expect(mockedGetParamToListPlayersFromQs).toHaveBeenCalledWith(
      queryStringParameters,
      expect.any(Object),
    );
    expect(logger.error).toHaveBeenCalledWith(errMsg);
    expect(response).toEqual(
      buildBadRequestError(
        `Bad query string parameters (${JSON.stringify(queryStringParameters)})`,
      ),
    );
  });
});
