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

// this is for our standardized use
export type SmartContractEvent = {
  [K in EventName]: {
    eventName: K;
    timestamp: Date;
    data: RecursivelyConvertPubkeyAndBnToString<EventsRecord[K]>;
  };
}[EventName];

// this is what anchor gives us
export type DecodedSmartContractEvent = {
  [K in EventName]: {
    name: K;
    data: EventsRecord[K];
  };
}[EventName];

// Gives an easy way to access the data type for a particular event
export type SmartContractEventData<T extends EventName> = Extract<
  SmartContractEvent,
  { eventName: T }
>["data"];
