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
