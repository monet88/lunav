/**
 * Append a validated return destination to an internal auth path.
 * Callers must pass a value already checked by parseAuthReturnDestination.
 */
export function withReturnTo(path: string, returnTo: string): string {
  if (returnTo.length === 0 || returnTo === '/') {
    return path
  }

  const url = new URL(path, 'http://localhost')
  url.searchParams.set('returnTo', returnTo)
  return `${url.pathname}${url.search}`
}
