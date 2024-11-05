import { DecodedSmartContractEvent } from "./types";
import { program } from "../clients/SolanaProgramClient";

/** Typed version of {@link program.coder.events.decode} */
export const decodeEventBase64Data = (
  base64Data: string,
): DecodedSmartContractEvent | null => {
  const decodedEvent = program.coder.events.decode(base64Data);
  return decodedEvent as DecodedSmartContractEvent | null;
};
