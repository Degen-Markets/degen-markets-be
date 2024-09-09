import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import idl from "../../resources/solana/idl/degen_pools.json";
import * as anchor from "@coral-xyz/anchor";
import { DegenPools } from "../../resources/solana/types/degen_pools";

export const connection = new Connection(
  clusterApiUrl("mainnet-beta"),
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
