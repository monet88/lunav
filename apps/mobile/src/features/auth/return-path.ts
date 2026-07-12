import { parseAuthReturnDestination } from '@lunav/contracts'

/**
 * Mobile post-sign-in href inside Expo Router.
 * Canonical `/account` maps to the protected account settings route; every other
 * validated fallback lands on the private shell entry.
 */
export type MobilePostSignInHref = '/(protected)' | '/(protected)/account'

/**
 * Validate a raw return destination, then map it to a local Expo href.
 * Unapproved destinations fall back safely — never open external or public
 * deep-link targets after a successful sign-in.
 */
export function resolveMobileSignInHref(
  rawReturnTo: string | undefined
): MobilePostSignInHref {
  const destination = parseAuthReturnDestination(rawReturnTo ?? '')
  if (destination === '/account') {
    return '/(protected)/account'
  }

  return '/(protected)'
}
