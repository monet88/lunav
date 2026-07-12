/**
 * Rebuild a lunav:// confirm URL for the shared callback parser.
 * Preserves duplicate `code` values so multi-code attacks still fail closed.
 * The resulting URL must never be logged.
 */
export function buildConfirmRequestUrl(
  codes: readonly string[]
): string | null {
  if (codes.length === 0) {
    return null
  }

  const params = new URLSearchParams()
  for (const code of codes) {
    params.append('code', code)
  }

  return `lunav://auth/confirm?${params.toString()}`
}
