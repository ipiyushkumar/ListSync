/** Safely parse a JSON string into a string array. Returns [] on null/invalid. */
export function parseGenres(str?: string): string[] {
  if (!str) return [];
  try {
    const p = JSON.parse(str);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
