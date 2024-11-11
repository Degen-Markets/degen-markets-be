import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { ActionPostResponse } from "@solana/actions-spec";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
} from "../../utils/httpResponses";
import createPoolTx from "../createPoolTx";
import _Utils from "../utils/createPoolTx.utils";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../clients/SolanaProgramClient";
import { defaultBanner } from "../constants";
import axios from "axios";
import ImageService from "../../utils/ImageService";
import S3Service from "../../utils/S3Service";

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

describe("getPayload", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
    jest.spyOn(connection, "getLatestBlockhash").mockResolvedValue({
      blockhash: "GzA4Tu7SpEBKHJBxww6DSqEUm3e77yzNX251c3vK8i5b",
      lastValidBlockHeight: 1,
    });
  });

  it("returns the payload if successful", async () => {
    const payload = await _Utils.serializeCreatePoolTx({
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

describe("getFinalImgUrl", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
  });

  it("returns default banner if no image URL is provided", async () => {
    const finalImgUrl = await _Utils.getFinalImgUrl(undefined, []);
    expect(finalImgUrl).toEqual(defaultBanner);
  });

  it("returns the processed image URL if an image URL is provided", async () => {
    const mockImgUrl = "mock-image-url";
    jest.spyOn(_Utils, "processAndUploadImage").mockResolvedValue(mockImgUrl);
    const finalImgUrl = await _Utils.getFinalImgUrl("mockImageUrl", []);
    expect(finalImgUrl).toEqual(mockImgUrl);
  });
});

describe("processAndUploadImage", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
  });

  it("throws an error if the image URL is invalid", async () => {
    jest.spyOn(axios, "get").mockRejectedValueOnce(new Error());
    await expect(
      _Utils.processAndUploadImage("mockImageUrl", []),
    ).rejects.toThrow("Invalid image URL");
  });

  it("throws an error if the image response is not a buffer", async () => {
    jest.spyOn(axios, "get").mockResolvedValueOnce({ data: "not a buffer" });
    await expect(
      _Utils.processAndUploadImage("mockImageUrl", []),
    ).rejects.toThrow("Couldn't find an image at that URL");
  });

  it("throws an error if image type cannot be determined", async () => {
    jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: Buffer.from("test") });
    jest.spyOn(ImageService, "getType").mockRejectedValueOnce(new Error());
    await expect(
      _Utils.processAndUploadImage("mockImageUrl", []),
    ).rejects.toThrow("Couldn't read that image");
  });

  it("throws an error if image type is not supported", async () => {
    jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: Buffer.from("test") });
    jest.spyOn(ImageService, "getType").mockResolvedValueOnce("tiff" as any);
    await expect(
      _Utils.processAndUploadImage("mockImageUrl", ["weird-type"]),
    ).rejects.toThrow(`Invalid image type. Try a valid WEIRD-TYPE image`);
  });

  it("throws an error if SVG sanitization fails", async () => {
    jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: Buffer.from("test") });
    jest.spyOn(ImageService, "getType").mockResolvedValueOnce("svg");
    jest.spyOn(ImageService, "sanitizeSvg").mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(
      _Utils.processAndUploadImage("mockImageUrl", ["svg"]),
    ).rejects.toThrow("Incompatible image. Try a valid SVG image");
  });

  it("successfully processes and uploads valid images", async () => {
    const mockBuffer = Buffer.from("test");
    const mockUrl = "https://example.com/image.png";

    jest.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBuffer });
    jest.spyOn(ImageService, "getType").mockResolvedValueOnce("png");
    jest.spyOn(S3Service, "upload").mockResolvedValueOnce({ url: mockUrl });

    const result = await _Utils.processAndUploadImage("mockImageUrl", ["png"]);
    expect(result).toBe(mockUrl);

    expect(S3Service.upload).toHaveBeenCalledWith({
      fileBuffer: mockBuffer,
      s3FolderKey: S3Service.publicFolder,
      s3ObjectName: expect.stringMatching(/.*\.png$/),
      additionalConfig: {
        ContentDisposition: "inline",
        ContentType: "image/png",
      },
    });
  });
});
