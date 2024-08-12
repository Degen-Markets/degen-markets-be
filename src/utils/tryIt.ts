// Use these utils to convert try-catches to a go style "errors as values"

export type TrialResult<Data = unknown, Err = unknown> =
  | { success: true; data: Data }
  | { success: false; err: Err };

export async function tryItAsync<ResultType = unknown, Err = unknown>(
  fn: () => Promise<ResultType>,
): Promise<TrialResult<ResultType, Err>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    return { success: false, err: err as Err };
  }
}

export function tryIt<ResultType = unknown, Err = unknown>(
  fn: () => ResultType,
): TrialResult<ResultType, Err> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (err) {
    return { success: false, err: err as Err };
  }
}
