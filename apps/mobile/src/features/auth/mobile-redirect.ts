/**
 * Local-only auth callbacks for this ticket.
 * Hosted HTTPS App Links remain residual work for a later slice.
 */
export const MOBILE_CONFIRM_REDIRECT = 'lunav://auth/confirm'
export const MOBILE_RECOVERY_REDIRECT = 'lunav://auth/recovery'

export function getMobileConfirmRedirectUrl(): string {
  return MOBILE_CONFIRM_REDIRECT
}

export function getMobileRecoveryRedirectUrl(): string {
  return MOBILE_RECOVERY_REDIRECT
}
