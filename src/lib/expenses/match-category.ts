export function matchCategoryId(
  categories: { id: string; name: string }[],
  label: string | undefined
): string | null {
  if (!label) return null;
  return categories.find((c) => c.name === label)?.id ?? null;
}
