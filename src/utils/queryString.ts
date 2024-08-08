import { typedObjectKeys } from "./typedObjectMethods";

export enum ESortDirections {
  ASC = "ASC", // ascending
  DESC = "DESC", // descending
}

export const getIsValidSortDirection = (
  inputStr: string,
): inputStr is ESortDirections => {
  return typedObjectKeys(ESortDirections).includes(inputStr as any);
};
