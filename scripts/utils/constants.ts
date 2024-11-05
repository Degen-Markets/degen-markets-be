import * as anchor from "@coral-xyz/anchor";
import { DegenPools } from "../../resources/solana/types/degen_pools";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import idl from "../../resources/solana/idl/degen_pools.json";
import { getLocalAccount } from "./keypairs";

import { connection } from "../../src/clients/SolanaProgramClient";

export const programId = new PublicKey(idl.address);

export const adminAccount = getLocalAccount();

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(adminAccount),
  anchor.AnchorProvider.defaultOptions(),
);

export const program = new anchor.Program(
  idl as unknown as anchor.Idl,
  provider,
) as unknown as anchor.Program<DegenPools>;
