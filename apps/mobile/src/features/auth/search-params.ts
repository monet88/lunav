function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asStringList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.length > 0 ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string => typeof entry === 'string' && entry.length > 0
    )
  }

  return []
}

/**
 * Parse Expo Router search params for the confirm deep link.
 * Invalid shapes fail closed to an empty code list (callback returns failure).
 */
export function parseConfirmSearchParams(input: unknown): {
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
