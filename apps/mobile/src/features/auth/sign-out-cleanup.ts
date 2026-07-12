import type { SignOutCleanup } from '@/lib/supabase/auth-state-controller'

/**
 * Product caches/realtime do not exist yet. Keep the ordered cleanup contract
 * so later stories can replace these stubs without changing call sites.
 */
export const stubSignOutCleanup: SignOutCleanup = {
  async cancelUserRequests(): Promise<void> {
    return
  },
  async clearUserCacheAndRealtime(): Promise<void> {
    return
  },
}
