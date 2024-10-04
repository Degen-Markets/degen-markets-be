import { BN, IdlEvents } from "@coral-xyz/anchor";
import { program } from "../solanaActions/constants";
import { PublicKey } from "@solana/web3.js";

/** the following are intermediary types for generating {@link SmartContractEvent} */

type EventsRecord = IdlEvents<typeof program.idl>;
type EventName = keyof EventsRecord;
type ConvertPubkeyAndBnToString<T> = T extends PublicKey | BN ? string : T;

type RecursivelyConvertPubkeyAndBnToString<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: RecursivelyConvertPubkeyAndBnToString<T[K]>;
      }
    : ConvertPubkeyAndBnToString<T>;

// this is basically the stringified version of the anchor event
export type SmartContractEvent = {
  [K in EventName]: {
    eventName: K;
    data: RecursivelyConvertPubkeyAndBnToString<EventsRecord[K]>;
  };
}[EventName];

export type PoolPausedEventData = Extract<
  SmartContractEvent,
  { eventName: "poolStatusUpdated" }
>["data"];
