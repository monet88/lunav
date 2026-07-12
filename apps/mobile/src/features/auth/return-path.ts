import { parseAuthReturnDestination } from '@lunav/contracts'

/**
 * Mobile post-sign-in href inside Expo Router.
 * Account settings (#10) will live under the protected group; for this slice the
 * only safe landing is the private shell entry.
 */
export type MobilePostSignInHref = '/(protected)'

/**
 * Validate a raw return destination, then map it to a local Expo href.
 * Unapproved destinations fall back safely — never open external or public
 * deep-link targets after a successful sign-in.
 *
 * parseAuthReturnDestination still runs so open-redirect / encoded tricks are
 * rejected even though every approved path currently lands on the same shell.
 */
export function resolveMobileSignInHref(
  rawReturnTo: string | undefined
): MobilePostSignInHref {
  // Force evaluation for side-effect validation; result is intentionally unused
  // until account routes (#10) need distinct protected sub-paths.
  void parseAuthReturnDestination(rawReturnTo ?? '')
  return '/(protected)'
}
