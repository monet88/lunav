import { clearRecoverySession, RECOVERY_SESSION_KEY } from './recovery-session'
import { mobileSignOutCleanup } from './sign-out-cleanup'

jest.mock('./recovery-session', () => {
  const actual = jest.requireActual('./recovery-session') as typeof import('./recovery-session')
  return {
    ...actual,
    clearRecoverySession: jest.fn(actual.clearRecoverySession),
  }
})

const clearRecoverySessionMock = clearRecoverySession as jest.MockedFunction<
  typeof clearRecoverySession
>

describe('mobileSignOutCleanup', () => {
  beforeEach(() => {
    clearRecoverySessionMock.mockClear()
    clearRecoverySessionMock.mockResolvedValue(undefined)
  })

  test('clears the local recovery proof during user-scoped cache cleanup', async () => {
    await mobileSignOutCleanup.clearUserCacheAndRealtime('user-a')

    expect(clearRecoverySessionMock).toHaveBeenCalledTimes(1)
  })

  test('keeps cancelUserRequests as a no-op until product caches exist', async () => {
    await expect(
      mobileSignOutCleanup.cancelUserRequests('user-a')
    ).resolves.toBeUndefined()
    expect(clearRecoverySessionMock).not.toHaveBeenCalled()
  })

  test('clearRecoverySession still deletes the SecureStore recovery key', async () => {
    // Unmock path for the real helper contract used by cleanup.
    const actual = jest.requireActual('./recovery-session') as typeof import('./recovery-session')
    const store = {
      deleteItemAsync: jest.fn(async () => undefined),
      getItemAsync: jest.fn(async () => null),
      setItemAsync: jest.fn(async () => undefined),
    }

    await actual.clearRecoverySession(store)

    expect(store.deleteItemAsync).toHaveBeenCalledWith(RECOVERY_SESSION_KEY)
  })
})
