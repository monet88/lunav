import type { SignOutCleanup } from '@/lib/supabase/auth-state-controller'
import { clearRecoverySession } from './recovery-session'

/**
 * Ordered user-scoped cleanup for mobile sign-out.
 * Clears the device-local recovery proof now. Product query caches / realtime
 * subscriptions do not exist yet — those hooks stay no-ops until later stories
 * can fill them without changing the controller call site.
 */
export const mobileSignOutCleanup: SignOutCleanup = {
  async cancelUserRequests(): Promise<void> {
    return
  },
  async clearUserCacheAndRealtime(): Promise<void> {
    await clearRecoverySession()
  },
}

/** @deprecated Prefer mobileSignOutCleanup — kept for existing test imports. */
export const stubSignOutCleanup = mobileSignOutCleanup
