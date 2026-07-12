import {
  clearAuthCallbackWorkCacheForTests,
  getOrCreateAuthCallbackWork,
  hasAuthCallbackWorkCacheKeyForTests,
} from './auth-callback-work'

describe('auth callback work cache', () => {
  beforeEach(() => {
    clearAuthCallbackWorkCacheForTests()
  })

  test('reuses the same in-flight promise for a key', async () => {
    let resolveWork: ((value: string) => void) | undefined
    const create = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveWork = resolve
        })
    )

    const first = getOrCreateAuthCallbackWork('recovery\0url', create)
    const second = getOrCreateAuthCallbackWork('recovery\0url', create)

    expect(first).toBe(second)
    expect(create).toHaveBeenCalledTimes(1)
    expect(hasAuthCallbackWorkCacheKeyForTests('recovery\0url')).toBe(true)

    resolveWork?.('/auth/reset-password')
    await expect(first).resolves.toBe('/auth/reset-password')
    await expect(second).resolves.toBe('/auth/reset-password')
  })

  test('evicts settled work so a later attempt can retry', async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce('/auth/recovery-failed')
      .mockResolvedValueOnce('/auth/reset-password')

    await expect(
      getOrCreateAuthCallbackWork('recovery\0url', create)
    ).resolves.toBe('/auth/recovery-failed')

    // Let finally microtask run and drop the settled entry.
    await Promise.resolve()
    expect(hasAuthCallbackWorkCacheKeyForTests('recovery\0url')).toBe(false)

    await expect(
      getOrCreateAuthCallbackWork('recovery\0url', create)
    ).resolves.toBe('/auth/reset-password')
    expect(create).toHaveBeenCalledTimes(2)
  })
})
