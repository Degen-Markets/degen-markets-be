import { PublicKey } from "@solana/web3.js";
import { ActionPostResponse } from "@solana/actions-spec";
import { connection } from "../../../clients/SolanaProgramClient";
import axios from "axios";
import S3Service from "../../../utils/S3Service";
import _Utils from "../createPoolTx.utils";
import ImageService from "../../../utils/ImageService";
import { defaultBanner } from "../../constants";

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
