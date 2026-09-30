// Custom free-text items ("others, please specify"), mirroring
// reactjs/src/utils/customList.ts. Stored as ONE TEXT column alongside the
// int[] catalogue column: a JSON array string. Multiple customs supported;
// legacy plain-text rows decode to a single entry. Backends pass TEXT through.

export function encodeCustomList(items: string[]): string {
  return JSON.stringify(items.map(s => s.trim()).filter(s => s !== ''));
}

export function decodeCustomList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[]).map(String).map(s => s.trim()).filter(s => s !== '');
  }
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (trimmed === '') return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return (parsed as unknown[]).map(String).map(s => s.trim()).filter(s => s !== '');
    }
  } catch {
    /* not JSON — fall through to legacy plain text */
  }
  return [trimmed];
}

export function displayCustomList(raw: unknown, joiner = '、'): string {
  return decodeCustomList(raw).join(joiner);
}
