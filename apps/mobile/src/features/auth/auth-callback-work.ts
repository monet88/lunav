/**
 * Share in-flight auth callback work across StrictMode remounts and short-lived
 * screen remounts so a single-use authorization code is exchanged once.
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
  return created
}

/** Test-only: clear shared callback work between cases. */
export function clearAuthCallbackWorkCacheForTests(): void {
  workCache.clear()
}
