import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import idl from "../../resources/solana/idl/degen_pools.json";

export const programId = new PublicKey(idl.address);
export const LAMPORTS_PER_SOL_BIGINT = BigInt(LAMPORTS_PER_SOL);
