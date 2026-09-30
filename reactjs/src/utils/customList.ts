// Custom free-text items ("others, please specify").
//
// Stored as ONE TEXT column alongside the int[] catalogue column:
// a JSON array string, e.g. '["換水撥摩打","加尾翼"]'. Multiple customs are
// supported; legacy plain-text rows ('換水撥') decode to a single entry.
// Backends pass the TEXT through untouched — all logic lives here.

export function encodeCustomList(items: string[]): string {
  return JSON.stringify(items.map(s => s.trim()).filter(s => s !== ''));
}

export function decodeCustomList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).map(s => s.trim()).filter(s => s !== '');
  }
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (trimmed === '') return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map(s => s.trim()).filter(s => s !== '');
    }
  } catch {
    /* not JSON — fall through to legacy plain text */
  }
  return [trimmed];
}

export function displayCustomList(raw: unknown, joiner = '、'): string {
  return decodeCustomList(raw).join(joiner);
}
