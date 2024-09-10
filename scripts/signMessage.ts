import { Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { adminAccount } from "./utils/constants";
import { messageString } from "../src/utils/cryptography";

// Function to sign a message using a private key
async function signMessage(message: string): Promise<{
  signature: Uint8Array;
  publicKey: PublicKey;
}> {
  // Decode the base58-encoded private key into bytes
  const privateKeyBytes = adminAccount.secretKey;

  // Create a Keypair from the private key
  const keypair = Keypair.fromSecretKey(privateKeyBytes);

  // Convert the message string to bytes (Uint8Array)
  const messageBytes = Buffer.from(message, "utf8");

  // Sign the message using the keypair's secret key
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

  return {
    signature,
    publicKey: keypair.publicKey,
  };
}

// Example usage:
(async () => {
  // Sign the message
  const { signature, publicKey } = await signMessage("messageString");

  console.log("Message:", messageString);
  console.log("Public Key:", publicKey.toBase58());
  console.log("Signature:", bs58.encode(signature)); // Output the signature as base58 string
})();
