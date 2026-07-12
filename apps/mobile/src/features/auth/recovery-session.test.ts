import {
  clearRecoverySession,
  hasRecoverySession,
  RECOVERY_SESSION_KEY,
  RECOVERY_SESSION_TTL_MS,
  setRecoverySession,
  type RecoverySessionStore,
} from './recovery-session'

function createMemoryStore(
  initial?: Record<string, string>
): RecoverySessionStore & { values: Map<string, string> } {
  const values = new Map<string, string>(Object.entries(initial ?? {}))

  return {
    values,
    async getItemAsync(key: string) {
      return values.has(key) ? (values.get(key) as string) : null
    },
    async setItemAsync(key: string, value: string) {
      values.set(key, value)
    },
    async deleteItemAsync(key: string) {
      values.delete(key)
    },
  }
}

describe('mobile recovery session proof', () => {
  test('stores a user-bound recovery proof in SecureStore shape', async () => {
    const store = createMemoryStore()
    const nowMs = 1_000_000

    await setRecoverySession('user-1', store, nowMs)

    expect(store.values.get(RECOVERY_SESSION_KEY)).toBe(
      JSON.stringify({
        expiresAt: nowMs + RECOVERY_SESSION_TTL_MS,
        userId: 'user-1',
      })
    )
    await expect(hasRecoverySession('user-1', store, nowMs)).resolves.toBe(
      true
    )
  })

  test('rejects a proof that does not match the verified user', async () => {
    const store = createMemoryStore()
    await setRecoverySession('user-a', store, 1_000)

    await expect(hasRecoverySession('user-b', store, 1_000)).resolves.toBe(
      false
    )
  })

  test('expires and clears a stale recovery proof', async () => {
    const store = createMemoryStore()
    const nowMs = 1_000
    await setRecoverySession('user-1', store, nowMs)

    await expect(
      hasRecoverySession(
        'user-1',
        store,
        nowMs + RECOVERY_SESSION_TTL_MS + 1
      )
    ).resolves.toBe(false)
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(false)
  })

  test('clearRecoverySession removes the proof', async () => {
    const store = createMemoryStore()
    await setRecoverySession('user-1', store, 1_000)
    await clearRecoverySession(store)

    await expect(hasRecoverySession('user-1', store, 1_000)).resolves.toBe(
      false
    )
  })
})
