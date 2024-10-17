import { APIGatewayProxyEventV2 } from "aws-lambda";
import deletePoolHandler from "../deletePool";
import {
  buildBadRequestError,
  buildNotFoundError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../../utils/httpResponses";
import { generateInvalidBodyEvents } from "./_utils";
import * as CryptoUtils from "../../../utils/cryptography";
import { ADMIN_PUBKEY } from "../../constants";
import PoolsService from "../../../pools/service";

const randomString = Math.random().toString(36).substring(2, 15);

const mockEventBody = {
  poolAddress: `pool-${randomString}`,
  signature: `sig-${randomString}`,
};

const mockEvent = {
  body: JSON.stringify(mockEventBody),
} as APIGatewayProxyEventV2;

const spiedVerifySignature = jest
  .spyOn(CryptoUtils, "verifySignature")
  .mockReturnValue(true);

const spiedDeletePool = jest
  .spyOn(PoolsService, "deletePool")
  .mockResolvedValue({
    // we don't actually check the return values
    address: "",
    title: "",
    description: "",
    image: "",
    isPaused: false,
    value: "",
    createdAt: new Date(),
    token: "",
  });

describe("deletePool", () => {
  it("returns a bad response for invalid JSON body", async () => {
    const badEventBody = {
      body: "{invalidJson",
    } as APIGatewayProxyEventV2;
    const response = await deletePoolHandler(badEventBody);

    expect(response).toEqual(
      buildBadRequestError("Couldn't parse request body"),
    );
  });

  it("returns a bad response for missing fields", async () => {
    const testEvents = generateInvalidBodyEvents({
      poolAddress: "string",
      signature: "string",
    });
    testEvents.forEach(async (event) => {
      const response = await deletePoolHandler(event);
      expect(response).toEqual(
        buildBadRequestError("Missing required fields in request body"),
      );
    });
  });

  it("returns a bad response for invalid signature", async () => {
    spiedVerifySignature.mockReturnValueOnce(false);

    const response = await deletePoolHandler(mockEvent);
    expect(spiedVerifySignature).toHaveBeenCalledWith(
      mockEventBody.signature,
      ADMIN_PUBKEY,
    );
    expect(response).toEqual(
      buildUnauthorizedError("Unauthorized: Admin access required"),
    );
  });

  it("returns a bad response for non-existent pool", async () => {
    spiedDeletePool.mockResolvedValueOnce(null);

    const response = await deletePoolHandler(mockEvent);
    expect(spiedDeletePool).toHaveBeenCalledWith(mockEventBody.poolAddress);
    expect(response).toEqual(
      buildNotFoundError(
        `Pool with address ${mockEventBody.poolAddress} not found`,
      ),
    );
  });

  it("returns a success response for valid request", async () => {
    const response = await deletePoolHandler(mockEvent);
    expect(response).toEqual(
      buildOkResponse(
        `Successfully deleted pool with address: ${mockEventBody.poolAddress}`,
      ),
    );
  });
});
