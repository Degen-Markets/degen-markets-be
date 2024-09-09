import bs58 from "bs58";
import nacl from "tweetnacl";
import { Logger } from "@aws-lambda-powertools/logger";

export const messageString = "Welcome to degenmarkets.com";

const logger = new Logger({ serviceName: "CryptographyService" });

export const verifySignature = (
  signatureBase58: string,
  publicKeyBase58: string,
): boolean => {
  logger.info(
    `verifying signature ${signatureBase58} for public key ${publicKeyBase58}`,
  );
  // Convert the signature and public key from base58 to Uint8Array
  const signature = bs58.decode(signatureBase58);
  const publicKey = bs58.decode(publicKeyBase58);

  // Convert the message to Uint8Array
  const messageBytes = Buffer.from(messageString, "utf-8");

  // Verify the signature using the public key and message
  return nacl.sign.detached.verify(messageBytes, signature, publicKey);
};
