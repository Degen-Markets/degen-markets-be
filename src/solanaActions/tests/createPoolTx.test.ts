import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { ActionPostResponse } from "@solana/actions-spec";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../../utils/httpResponses";
import createPoolTx, { _Utils } from "../createPoolTx";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../clients/SolanaProgramClient";

describe("createPoolTx", () => {
  let mockEvent: APIGatewayProxyEventV2;
  let spiedProcessAndUploadImage: jest.SpyInstance;
  let spiedGetPayload: jest.SpyInstance;
  let mockPayload: string;

  beforeAll(() => {
    mockEvent = {
      queryStringParameters: {
        image: "imageUrl",
        title: "mockTitle",
        description: "mockDescription",
      },
      body: JSON.stringify({
        account: "GzA4Tu7SpEBKHJBxww6DSqEUm3e77yzNX251c3vK8i5b",
      }),
    } as unknown as APIGatewayProxyEventV2;

    spiedProcessAndUploadImage = jest
      .spyOn(_Utils, "processAndUploadImage")
      .mockResolvedValue("mock-image-url");

    mockPayload = "mock-payload";
    spiedGetPayload = jest
      .spyOn(_Utils, "getPayload")
      .mockResolvedValue(mockPayload as any);
  });

  it("should return a 400 error if the title is not found", async () => {
    const badEvent = {} as APIGatewayProxyEventV2;
    const response = await createPoolTx(badEvent);
    expect(response).toEqual(
      buildBadRequestError(
        "Pool title missing in request",
        ACTIONS_CORS_HEADERS,
      ),
    );
  });

  it("should return a 400 error if the account is invalid", async () => {
    // missing
    const badEvent = {
      ...mockEvent,
      body: JSON.stringify({}),
    } as APIGatewayProxyEventV2;
    const response = await createPoolTx(badEvent);
    expect(response).toEqual(
      buildBadRequestError(
        "Valid account is missing in request",
        ACTIONS_CORS_HEADERS,
      ),
    );

    // invalid
    const badEvent2 = {
      ...mockEvent,
      body: JSON.stringify({ account: "invalid" }),
    } as APIGatewayProxyEventV2;
    const response2 = await createPoolTx(badEvent2);
    expect(response2).toEqual(
      buildBadRequestError(
        "Valid account is missing in request",
        ACTIONS_CORS_HEADERS,
      ),
    );
  });

  it("returns a 400 error if the image processing failed", async () => {
    const mockErrMsg = "mock-error";
    spiedProcessAndUploadImage.mockRejectedValueOnce(new Error(mockErrMsg));
    const response = await createPoolTx(mockEvent);
    expect(response).toEqual(
      buildBadRequestError(mockErrMsg, ACTIONS_CORS_HEADERS),
    );
  });

  it("returns a 500 error if the payload generation failed", async () => {
    spiedGetPayload.mockRejectedValueOnce(new Error());
    const response = await createPoolTx(mockEvent);
    expect(response).toEqual(
      buildInternalServerError(
        "Something went wrong, please try again",
        ACTIONS_CORS_HEADERS,
      ),
    );
  });

  it("returns a 200 response with the payload if successful", async () => {
    const response = await createPoolTx(mockEvent);
    expect(response).toEqual(
      buildOkResponse(mockPayload, ACTIONS_CORS_HEADERS),
    );
  });
});

describe("getPayload", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
    jest.spyOn(connection, "getLatestBlockhash").mockResolvedValue({
      blockhash: "GzA4Tu7SpEBKHJBxww6DSqEUm3e77yzNX251c3vK8i5b",
      lastValidBlockHeight: 1,
    });
  });

  it("returns the payload if successful", async () => {
    const payload = await _Utils.getPayload({
      poolTitle: "mockTitle",
      imgUrl: "mockImageUrl",
      description: "mockDescription",
      creator: new PublicKey("GzA4Tu7SpEBKHJBxww6DSqEUm3e77yzNX251c3vK8i5b"),
    });

    const expectedPayload: ActionPostResponse = {
      type: "transaction",
      transaction: expect.any(String),
      links: {
        next: expect.any(Object),
      },
    };

    expect(payload).toEqual(expectedPayload);
  });
});
