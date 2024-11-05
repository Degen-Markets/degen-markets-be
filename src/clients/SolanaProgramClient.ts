import { Connection } from "@solana/web3.js";
import { getMandatoryEnvVariable } from "../utils/getMandatoryEnvValue";
import * as anchor from "@coral-xyz/anchor";
import idl from "../../resources/solana/idl/degen_pools.json";
import { DegenPools } from "../../resources/solana/types/degen_pools";

export const connection = new Connection(
  getMandatoryEnvVariable("SOLANA_RPC_URL"),
  "confirmed",
);

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(anchor.web3.Keypair.generate()),
  anchor.AnchorProvider.defaultOptions(),
);

export const program = new anchor.Program(
  idl as unknown as anchor.Idl,
  provider,
) as unknown as anchor.Program<DegenPools>;
