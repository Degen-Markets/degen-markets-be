/**
 * Narrows a record type based on a discriminator field.
 *
 * @template T The original record type
 * @template D The discriminator record with a single key-value pair
 *
 * @example
 * type Event =
 *   | { type: 'click', x: number, y: number }
 *   | { type: 'keypress', key: string }
 *
 * type ClickEvent = NarrowRecord<Event, { type: 'click' }>
 * // Result: { type: 'click', x: number, y: number }
 */
export type NarrowRecord<
  T extends Record<string, unknown>,
  D extends Partial<T>,
> = Extract<T, D>;
