import { z } from 'zod'

const AUTH_RETURN_FALLBACK = '/'
const AUTH_RETURN_ALLOWED_PATH = '/account'
const INTERNAL_BASE_URL = 'https://app.lunav.vn'
const INTERNAL_ORIGIN = new URL(INTERNAL_BASE_URL).origin
function containsAsciiControlCharacter(input: string): boolean {
  return Array.from(input).some((character) => {
    const codePoint = character.codePointAt(0)

    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
  })
}
const ENCODED_SEPARATOR_PATTERN = /%2f|%5c/i
const PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:/i

const authIdentitySchema = z.object({
  id: z.string().trim().min(1),
  email: z.email(),
  email_confirmed_at: z.string().datetime().nullable(),
})

export type AuthIdentity = {
  userId: string
  email: string
  isEmailConfirmed: boolean
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'unconfirmed'; identity: AuthIdentity }
  | { status: 'authenticated'; identity: AuthIdentity }

export type AuthUserInput = {
  id: string
  email: string
  email_confirmed_at: string | null
}

export function normalizeAuthIdentity(input: unknown): AuthIdentity {
  const normalizedInput = authIdentitySchema.parse(input)
  const isEmailConfirmed = normalizedInput.email_confirmed_at !== null

  return {
    userId: normalizedInput.id,
    email: normalizedInput.email,
    isEmailConfirmed,
  }
}

export function normalizeAuthState(
  input: 'loading' | null | unknown
): AuthState {
  if (input === 'loading') {
    return { status: 'loading' }
  }

  if (input === null) {
    return { status: 'anonymous' }
  }

  const identity = normalizeAuthIdentity(input)

  if (identity.isEmailConfirmed) {
    return { status: 'authenticated', identity }
  }

  return { status: 'unconfirmed', identity }
}

export function parseAuthReturnDestination(input: string): string {
  if (input.length === 0) {
    return AUTH_RETURN_FALLBACK
  }

  if (containsAsciiControlCharacter(input)) {
    return AUTH_RETURN_FALLBACK
  }

  if (input.startsWith('//')) {
    return AUTH_RETURN_FALLBACK
  }

  if (input.includes('\\')) {
    return AUTH_RETURN_FALLBACK
  }

  if (ENCODED_SEPARATOR_PATTERN.test(input)) {
    return AUTH_RETURN_FALLBACK
  }

  let decodedInput: string

  try {
    decodedInput = decodeURIComponent(input)
  } catch {
    return AUTH_RETURN_FALLBACK
  }

  if (containsAsciiControlCharacter(decodedInput)) {
    return AUTH_RETURN_FALLBACK
  }

  if (decodedInput.trim() !== decodedInput) {
    return AUTH_RETURN_FALLBACK
  }

  if (decodedInput.includes('\\')) {
    return AUTH_RETURN_FALLBACK
  }

  if (PROTOCOL_PATTERN.test(decodedInput)) {
    let absoluteUrl: URL

    try {
      absoluteUrl = new URL(decodedInput)
    } catch {
      return AUTH_RETURN_FALLBACK
    }

    if (absoluteUrl.origin !== INTERNAL_ORIGIN) {
      return AUTH_RETURN_FALLBACK
    }

    if (absoluteUrl.pathname !== AUTH_RETURN_ALLOWED_PATH) {
      return AUTH_RETURN_FALLBACK
    }

    if (absoluteUrl.search.length > 0) {
      return AUTH_RETURN_FALLBACK
    }

    return AUTH_RETURN_ALLOWED_PATH
  }

  if (decodedInput.includes('//')) {
    return AUTH_RETURN_FALLBACK
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(decodedInput, INTERNAL_BASE_URL)
  } catch {
    return AUTH_RETURN_FALLBACK
  }

  if (parsedUrl.origin !== INTERNAL_ORIGIN) {
    return AUTH_RETURN_FALLBACK
  }

  if (parsedUrl.pathname !== AUTH_RETURN_ALLOWED_PATH) {
    return AUTH_RETURN_FALLBACK
  }

  if (parsedUrl.search.length > 0) {
    return AUTH_RETURN_FALLBACK
  }

  return AUTH_RETURN_ALLOWED_PATH
}
