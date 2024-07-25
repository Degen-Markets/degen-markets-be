import * as anchor from "@coral-xyz/anchor";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "yaml";
import { provider } from "./constants";

const CONFIG_FILE_PATH = path.resolve(
  os.homedir(),
  ".config",
  "solana",
  "cli",
  "config.yml",
);

export const createKeypairFromFile = (filePath: string) => {
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
};

export const getLocalAccount = () => {
  const configYml = fs.readFileSync(CONFIG_FILE_PATH, { encoding: "utf8" });
  const keypairPath = yaml.parse(configYml).keypair_path;
  const localKeypair = createKeypairFromFile(keypairPath);

  console.log(`Local account loaded successfully: ${localKeypair.publicKey}`);
  return localKeypair;
};

export const generateKeypair = async () => {
  let keypair = anchor.web3.Keypair.generate();
  return keypair;
};
