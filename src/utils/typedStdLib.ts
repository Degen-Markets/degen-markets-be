export const typedObjectEntries = <Obj extends object>(
  obj: Obj,
): [keyof Obj, Obj[keyof Obj]][] => {
  return Object.entries(obj) as [keyof Obj, Obj[keyof Obj]][];
};

export const typedObjectKeys = <Obj extends object>(
  obj: Obj,
): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};

export const typedIncludes = <
  Arr extends ReadonlyArray<unknown> | Array<unknown>,
>(
  arr: Arr,
  elToCheck: unknown,
): elToCheck is Arr[number] => {
  return arr.includes(elToCheck);
};
