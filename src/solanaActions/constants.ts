import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../resources/solana/idl/degen_pools.json";
import * as anchor from "@coral-xyz/anchor";
import { DegenPools } from "../../resources/solana/types/degen_pools";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";

export const connection = new Connection(
  getMandatoryEnvVariable("SOLANA_RPC_URL"),
  "confirmed",
);

export const programId = new PublicKey(idl.address);

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(anchor.web3.Keypair.generate()),
  anchor.AnchorProvider.defaultOptions(),
);

export const program = new anchor.Program(
  idl as unknown as anchor.Idl,
  provider,
) as unknown as anchor.Program<DegenPools>;

export const defaultBanner =
  "https://degen-markets-static.s3.eu-west-1.amazonaws.com/degen-markets-banner.jpeg";
