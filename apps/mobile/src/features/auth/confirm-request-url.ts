/**
 * Rebuild a lunav:// confirm URL for the shared callback parser.
 * Preserves duplicate `code` values so multi-code attacks still fail closed.
 * The resulting URL must never be logged.
 */
export function buildConfirmRequestUrl(
  codes: readonly string[]
): string | null {
  return buildAuthCallbackRequestUrl('lunav://auth/confirm', codes)
}

/**
 * Rebuild a lunav:// recovery URL for the shared callback parser.
 * Same multi-code cardinality rules as confirmation.
 */
export function buildRecoveryRequestUrl(
  codes: readonly string[]
): string | null {
  return buildAuthCallbackRequestUrl('lunav://auth/recovery', codes)
}

function buildAuthCallbackRequestUrl(
  base: string,
  codes: readonly string[]
): string | null {
  if (codes.length === 0) {
    return null
  }

  const params = new URLSearchParams()
  for (const code of codes) {
    params.append('code', code)
  }

  return `${base}?${params.toString()}`
}
