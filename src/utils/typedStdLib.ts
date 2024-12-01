export const typedIncludes = <
  Arr extends ReadonlyArray<unknown> | Array<unknown>,
>(
  arr: Arr,
  elToCheck: unknown,
): elToCheck is Arr[number] => {
  return arr.includes(elToCheck);
};
