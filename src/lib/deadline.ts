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
