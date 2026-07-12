import * as SecureStore from 'expo-secure-store'

/**
 * Mobile recovery proof is device-local (SecureStore), not a web cookie.
 * Bound to the userId from a successful recovery exchange and expires quickly.
 *
 * TTL uses wall-clock time and is a local UX gate only. Authorization still
 * requires a live authenticated Supabase recovery session + matching userId
 * before updateUser; server session lifetime remains the real hard bound.
 */
export const RECOVERY_SESSION_KEY = 'lunav-recovery-session'
export const RECOVERY_SESSION_TTL_MS = 600_000

export interface RecoverySessionStore {
  deleteItemAsync(key: string): Promise<void>
  getItemAsync(key: string): Promise<string | null>
  setItemAsync(key: string, value: string): Promise<void>
}

interface RecoverySessionRecord {
  expiresAt: number
  userId: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseRecoverySessionRecord(
  raw: string | null
): RecoverySessionRecord | null {
  if (raw === null || raw.length === 0) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null
    }

    const userId = parsed.userId.trim()
    if (userId.length === 0 || !Number.isFinite(parsed.expiresAt)) {
      return null
    }

    return { expiresAt: parsed.expiresAt, userId }
  } catch {
    return null
  }
}

export async function setRecoverySession(
  userId: string,
  store: RecoverySessionStore = SecureStore,
  nowMs: number = Date.now()
): Promise<void> {
  const trimmed = userId.trim()
  if (trimmed.length === 0) {
    return
  }

  const record: RecoverySessionRecord = {
    expiresAt: nowMs + RECOVERY_SESSION_TTL_MS,
    userId: trimmed,
  }

  await store.setItemAsync(RECOVERY_SESSION_KEY, JSON.stringify(record))
}

export async function hasRecoverySession(
  userId: string,
  store: RecoverySessionStore = SecureStore,
  nowMs: number = Date.now()
): Promise<boolean> {
  const trimmed = userId.trim()
  if (trimmed.length === 0) {
    return false
  }

  const record = parseRecoverySessionRecord(
    await store.getItemAsync(RECOVERY_SESSION_KEY)
  )

  if (record === null) {
    return false
  }

  if (record.expiresAt <= nowMs) {
    await store.deleteItemAsync(RECOVERY_SESSION_KEY)
    return false
  }

  return record.userId === trimmed
}

export async function clearRecoverySession(
  store: RecoverySessionStore = SecureStore
): Promise<void> {
  await store.deleteItemAsync(RECOVERY_SESSION_KEY)
}
