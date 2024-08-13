export type NonNullableRecord<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};
