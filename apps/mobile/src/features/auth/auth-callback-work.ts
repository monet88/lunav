/**
 * Share in-flight auth callback work across StrictMode remounts and short-lived
 * screen remounts so a single-use authorization code is exchanged once.
 *
 * Entries are removed when the promise settles so authorization codes are not
 * retained after navigation strips them from history, and a later remount of the
 * same URL can retry after a transient failure.
 */
const workCache = new Map<string, Promise<string>>()

export function getOrCreateAuthCallbackWork(
  key: string,
  create: () => Promise<string>
): Promise<string> {
  const existing = workCache.get(key)
  if (existing) {
    return existing
  }

  const created = create()
  workCache.set(key, created)
  void created.finally(() => {
    // Only drop this exact in-flight entry; a newer attempt may already own the key.
    if (workCache.get(key) === created) {
      workCache.delete(key)
    }
  })
  return created
}

/** Test-only: clear shared callback work between cases. */
export function clearAuthCallbackWorkCacheForTests(): void {
  workCache.clear()
}

/** Test-only: inspect whether a key is still cached. */
export function hasAuthCallbackWorkCacheKeyForTests(key: string): boolean {
  return workCache.has(key)
}
