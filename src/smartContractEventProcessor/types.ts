import { BN, IdlEvents } from "@coral-xyz/anchor";
import { program } from "../solanaActions/constants";
import { PublicKey } from "@solana/web3.js";

/** the following are intermediary types for generating {@link SmartContractEvent} */

type EventsRecord = IdlEvents<typeof program.idl>;
type EventName = keyof EventsRecord;
type ConvertToString<T> = T extends PublicKey | BN ? string : T;

type RecursivelyConvertToString<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: RecursivelyConvertToString<T[K]>;
      }
    : ConvertToString<T>;

// this is basically the stringified version of the anchor event
export type SmartContractEvent = {
  [K in EventName]: {
    eventName: K;
    data: RecursivelyConvertToString<EventsRecord[K]>;
  };
}[EventName];
