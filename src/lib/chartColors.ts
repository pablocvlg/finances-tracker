const SERIES_COUNT = 8;

export function assignCategoryColors(keys: string[]): Map<string, string> {
  const sorted = Array.from(new Set(keys)).sort();
  const colors = new Map<string, string>();
  sorted.forEach((key, i) => {
    colors.set(key, `var(--series-${(i % SERIES_COUNT) + 1})`);
  });
  return colors;
}
