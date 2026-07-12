/**
 * Local-only confirmation callback for this ticket.
 * Hosted HTTPS App Links remain residual work for a later slice.
 */
export const MOBILE_CONFIRM_REDIRECT = 'lunav://auth/confirm'

export function getMobileConfirmRedirectUrl(): string {
  return MOBILE_CONFIRM_REDIRECT
}
