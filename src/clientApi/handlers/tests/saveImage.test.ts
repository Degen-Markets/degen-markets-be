import { saveImage } from "../saveImage";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { buildUnauthorizedError } from "../../../utils/httpResponses";
import * as cryptography from "../../../utils/cryptography";
import { S3Client } from "@aws-sdk/client-s3";

describe("saveImage", () => {
  const payload = {
    image: "fake-base64",
    title: "Title of a pool",
    signature: "random signature",
  };
  const event = {
    body: JSON.stringify(payload),
  } as APIGatewayProxyEventV2;

  afterEach(() => jest.resetAllMocks());

  it("should not let a non-admin wallet upload an image", async () => {
    jest.spyOn(cryptography, "verifySignature").mockImplementation(() => false);
    const response = await saveImage(event);
    expect(response).toEqual(buildUnauthorizedError("Incorrect Wallet!"));
  });

  it("should upload to S3 bucket", async () => {
    jest.spyOn(cryptography, "verifySignature").mockImplementation(() => true);
    const s3SendSpy = jest.fn();
    jest.spyOn(S3Client.prototype, "send").mockImplementation(s3SendSpy);

    await saveImage(event);
    expect(s3SendSpy).toBeCalledTimes(1);
  });
});
