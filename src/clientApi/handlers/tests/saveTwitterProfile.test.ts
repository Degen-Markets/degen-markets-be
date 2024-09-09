import { Logger } from "@aws-lambda-powertools/logger";
import * as dotenv from "dotenv";
dotenv.config();
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import PlayersService from "../../../players/service";
import { DrizzleClient } from "../../../clients/DrizzleClient";
import saveTwitterProfile from "../saveTwitterProfile";
import * as TwitterUtils from "../../../utils/twitter";
import { findMyUser, TwitterResponse } from "twitter-api-sdk/dist/types";
import { PlayerEntity } from "../../../players/types";
import { buildOkResponse } from "../../../utils/httpResponses";

jest.mock("@aws-lambda-powertools/logger");
jest.mock("../../../clients/DrizzleClient");
const mockDb = {} as any;
jest.mocked(DrizzleClient.makeDb).mockResolvedValue(mockDb);
const logger = jest.mocked(Logger).mock.instances[0] as jest.Mocked<Logger>;

describe("saveTwitterProfile", () => {
  beforeEach(() => {
    logger.info.mockClear();
  });

  it("saves the user after validation", async () => {
    const twitterResponse = {
      data: {
        username: "rajgokal",
        profile_image_url: "https://x.com/rajgokal/photo",
      },
    } as TwitterResponse<findMyUser>;
    const twitterCode = "twitterCode";
    const signature =
      "31q8WBjJuLcw8nodrRdmdSrDYT9GX5sZx75X2cGJSq4kftKDrESRwpeKp6xhTXbffZT4Hp8JADMjbScT4wrJqET";
    const address = "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
    const event = {
      body: JSON.stringify({
        twitterCode,
        signature,
        address,
      }),
    } as APIGatewayProxyEventV2;
    jest
      .spyOn(TwitterUtils, "requestAccessToken")
      .mockImplementation(() => Promise.resolve(""));
    jest
      .spyOn(TwitterUtils, "findConnectedUser")
      .mockImplementation(() => Promise.resolve(twitterResponse));

    const insertedPlayer: PlayerEntity = {
      address,
      points: 0,
      twitterPfpUrl: String(twitterResponse.data?.profile_image_url),
      twitterUsername: String(twitterResponse.data?.username),
    };

    jest
      .spyOn(PlayersService, "insertNewOrSaveTwitterProfile")
      .mockImplementation(() => {
        return Promise.resolve(insertedPlayer);
      });

    const result = await saveTwitterProfile(event);
    expect(PlayersService.insertNewOrSaveTwitterProfile).toHaveBeenCalledWith(
      mockDb,
      {
        address,
        twitterPfpUrl: twitterResponse.data?.profile_image_url,
        twitterUsername: twitterResponse.data?.username,
      },
    );
    expect(result).toEqual(buildOkResponse(insertedPlayer));
  });

  it("returns a bad request if the user's signature doesn't match their address", async () => {
    const twitterCode = "twitterCode";
    const invalidSignature =
      "333Fkd3MzNhcvh8JBZM5CiaBqpnxh8mm91sg3rKAqn5sgUATSXeiRXVg5k6SZyb9PUjH9YtJUkyzyHYWDNeuku2h";
    const address = "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
    const event = {
      body: JSON.stringify({
        twitterCode,
        signature: invalidSignature,
        address,
      }),
    } as APIGatewayProxyEventV2;

    const result: APIGatewayProxyResultV2 = await saveTwitterProfile(event);
    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });
});
