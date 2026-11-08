export const withinDeadline = async <T>(
  work: Promise<T>,
  ms: number,
  message: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  // oxlint-disable-next-line promise/avoid-new -- setTimeout has no promise form on Workers
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([work, expired]);
  } finally {
    clearTimeout(timer);
  }
};

export const sleep = (ms: number): Promise<void> =>
  // oxlint-disable-next-line promise/avoid-new -- setTimeout has no promise form on Workers
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Somewhere between `ms` and twice that, so scans that failed together don't come back together. */
export const withJitter = (ms: number): number => ms * (1 + Math.random());
