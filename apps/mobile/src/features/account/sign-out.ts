export type PublicAuthHref = '/(auth)'

export interface SignOutNavigation {
  signOut: () => Promise<void>
  replace: (href: PublicAuthHref) => void
}

/**
 * Ordered user-scoped cleanup + session clear already live in the session
 * controller. After that settles, replace into the public auth shell so the
 * user is not left on a protected route that is about to unmount.
 */
export async function signOutToPublic({
  signOut,
  replace,
}: SignOutNavigation): Promise<void> {
  await signOut()
  replace('/(auth)')
}
