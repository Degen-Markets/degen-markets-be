import { saveImage } from "../saveImage";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  buildBadRequestError,
  buildInternalServerError,
  buildOkResponse,
  buildUnauthorizedError,
} from "../../../utils/httpResponses";
import * as Cryptography from "../../../utils/cryptography";
import S3Service from "../../../utils/S3Service";
import { ADMIN_PUBKEY } from "../../constants";

describe("saveImage", () => {
  const payload = {
    image: "fake-base64",
    title: "Title of a pool",
    signature: "random signature",
  };
  const event = {
    body: JSON.stringify(payload),
  } as APIGatewayProxyEventV2;

  const spiedVerifySignature = jest
    .spyOn(Cryptography, "verifySignature")
    .mockReturnValue(true);

  const mockS3UploadResponse = {
    url: "fake-url",
  };
  const spiedS3Upload = jest
    .spyOn(S3Service, "upload")
    .mockResolvedValue(mockS3UploadResponse);

  it("returns a bad request if image is missing", async () => {
    const badEvent = {
      body: JSON.stringify({
        image: undefined,
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveImage(badEvent);
    expect(response).toEqual(buildBadRequestError("Missing image"));
  });

  it("returns a bad request if title is missing", async () => {
    const badEvent = {
      body: JSON.stringify({
        image: "fake-base64",
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveImage(badEvent);
    expect(response).toEqual(buildBadRequestError("Missing title"));
  });

  it("returns a bad request if signature is missing", async () => {
    const badEvent = {
      body: JSON.stringify({
        image: "fake-base64",
        title: "Title of a pool",
      }),
    } as APIGatewayProxyEventV2;
    const response = await saveImage(badEvent);
    expect(response).toEqual(buildBadRequestError("Missing signature"));
  });

  it("should not let a non-admin wallet upload an image", async () => {
    spiedVerifySignature.mockReturnValueOnce(false);
    const response = await saveImage(event);

    expect(spiedVerifySignature).toHaveBeenCalledWith(
      payload.signature,
      ADMIN_PUBKEY,
    );
    expect(response).toEqual(buildUnauthorizedError("Incorrect Wallet!"));
  });

  it("should return an error if S3 upload fails", async () => {
    spiedS3Upload.mockRejectedValueOnce(new Error("Failed to upload"));
    const response = await saveImage(event);
    const imgBuffer = Buffer.from(payload.image, "base64");

    expect(spiedVerifySignature).toHaveBeenCalledWith(
      payload.signature,
      ADMIN_PUBKEY,
    );
    expect(spiedS3Upload).toHaveBeenCalledWith({
      fileBuffer: imgBuffer,
      s3FolderKey: "images",
      s3ObjectName: `${payload.title}.jpg`,
      additionalConfig: {
        ContentDisposition: "inline",
        ContentType: "image/jpg",
      },
    });
    expect(response).toEqual(buildInternalServerError("Something went wrong"));
  });

  it("should upload to S3 bucket", async () => {
    const response = await saveImage(event);

    const imgBuffer = Buffer.from(payload.image, "base64");
    expect(spiedS3Upload).toHaveBeenCalledWith({
      fileBuffer: imgBuffer,
      s3FolderKey: "images",
      s3ObjectName: `${payload.title}.jpg`,
      additionalConfig: {
        ContentDisposition: "inline",
        ContentType: "image/jpg",
      },
    });
    expect(response).toEqual(
      buildOkResponse({
        status: "SUCCESS",
        imageUrl: mockS3UploadResponse.url,
      }),
    );
  });
});
