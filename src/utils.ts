export const bisectMax = async (
  min: number,
  max: number,
  predicate: (mid: number) => boolean | Promise<boolean>,
) => {
  while (min < max) {
    const mid = Math.floor((min + max) / 2);

    if (await predicate(mid)) {
      min = mid + 1;
    } else {
      max = mid;
    }
  }

  return min;
};

export const shuffle = <T>(array: T[]) => {
  const keys = Array.from({ length: array.length }, () => Math.random());

  return array
    .map((value, index) => ({ value, key: keys[index] }))
    .sort((a, b) => a.key - b.key)
    .map(({ value }) => value);
};
