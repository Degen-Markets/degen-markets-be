import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../../utils/httpResponses";
import createPoolTx from "../createPoolTx";
import _Utils from "../utils/createPoolTx.utils";
import { APIGatewayProxyEventV2 } from "aws-lambda";

describe("createPoolTx", () => {
  let mockEvent: APIGatewayProxyEventV2;
  let spiedProcessAndUploadImage: jest.SpyInstance;
  let spiedSerializeCreatePoolTx: jest.SpyInstance;
  let mockTxPayload: string;

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

    mockTxPayload = "mock-payload";
    spiedSerializeCreatePoolTx = jest
      .spyOn(_Utils, "serializeCreatePoolTx")
      .mockResolvedValue(mockTxPayload as any);
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
    spiedSerializeCreatePoolTx.mockRejectedValueOnce(new Error());
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
      buildOkResponse(mockTxPayload, ACTIONS_CORS_HEADERS),
    );
  });
});
