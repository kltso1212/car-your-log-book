// Local-first error type. Messages match the cloud backend wording
// (車輛已被註冊 / 已有入油記錄) so UI alerts stay identical.
export class DbDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DbDuplicateError';
  }
}

export function isUniqueViolation(e: unknown): boolean {
  const msg = String((e as { message?: unknown })?.message ?? e);
  return msg.includes('UNIQUE constraint failed');
}
