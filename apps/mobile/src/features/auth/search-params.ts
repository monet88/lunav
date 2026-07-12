function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Preserve every string entry (including empty) so callers can enforce true
 * cardinality. Filtering empties here would collapse `code=valid&code=` into a
 * single valid code and incorrectly allow exchange.
 */
function asStringList(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  return []
}

/**
 * Parse Expo Router search params for confirm / recovery deep links.
 * Invalid shapes fail closed to an empty code list (callback returns failure).
 */
export function parseConfirmSearchParams(input: unknown): {
  codes: string[]
} {
  return parseAuthCodeSearchParams(input)
}

/**
 * Recovery deep-link params use the same single-code cardinality rules.
 */
export function parseRecoverySearchParams(input: unknown): {
  codes: string[]
} {
  return parseAuthCodeSearchParams(input)
}

function parseAuthCodeSearchParams(input: unknown): {
  codes: string[]
} {
  if (!isRecord(input)) {
    return { codes: [] }
  }

  return { codes: asStringList(input.code) }
}

/**
 * Parse confirm-email screen params. Only the explicit single `error` status
 * is honored; any other shape stays non-error.
 */
export function parseConfirmEmailSearchParams(input: unknown): {
  initialError: boolean
} {
  if (!isRecord(input)) {
    return { initialError: false }
  }

  const statuses = asStringList(input.status)
  return { initialError: statuses.length === 1 && statuses[0] === 'error' }
}

/**
 * Parse optional sign-in return destination. Only a single string value is
 * accepted; arrays / missing keys fall back to empty so the shared contract
 * applies its safe default.
 */
export function parseSignInSearchParams(input: unknown): {
  returnTo: string
} {
  if (!isRecord(input)) {
    return { returnTo: '' }
  }

  const values = asStringList(input.returnTo)
  return { returnTo: values.length === 1 ? values[0] : '' }
}

/**
 * Parse forgot-password / recovery failure screen params. Only the explicit
 * single `error` status is honored.
 */
export function parseForgotPasswordSearchParams(input: unknown): {
  initialError: boolean
} {
  if (!isRecord(input)) {
    return { initialError: false }
  }

  const statuses = asStringList(input.status)
  return { initialError: statuses.length === 1 && statuses[0] === 'error' }
}
