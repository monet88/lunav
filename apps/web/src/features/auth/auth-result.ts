interface ProviderError {
  code?: string
  message?: string
}

interface ProviderResult {
  error: ProviderError | null
}

export type AuthActionResult = {
  kind: 'confirmation-pending' | 'error' | 'recovery-pending'
  message: string
}

const CONFIRMATION_PENDING_MESSAGE =
  'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.'
const RECOVERY_PENDING_MESSAGE =
  'Neu dia chi email hop le, ban se nhan duoc huong dan dat lai mat khau.'
const SIGN_IN_FAILURE_MESSAGE =
  'Email hoac mat khau khong dung, hoac email chua duoc xac nhan.'
const RATE_LIMIT_MESSAGE =
  'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.'
const GENERIC_FAILURE_MESSAGE = 'Khong the hoan tat yeu cau. Vui long thu lai.'

function isRateLimitError(error: ProviderError | null): boolean {
  return (
    error?.code === 'over_request_rate_limit' ||
    error?.code === 'over_email_send_rate_limit'
  )
}

export function mapConfirmationPendingResult(
  result: ProviderResult
): AuthActionResult {
  if (isRateLimitError(result.error)) {
    return { kind: 'error', message: RATE_LIMIT_MESSAGE }
  }

  return {
    kind: 'confirmation-pending',
    message: CONFIRMATION_PENDING_MESSAGE,
  }
}

export function mapSignUpResult(result: ProviderResult): AuthActionResult {
  return mapConfirmationPendingResult(result)
}

export function mapForgotPasswordResult(result: ProviderResult): AuthActionResult {
  if (isRateLimitError(result.error)) {
    return { kind: 'error', message: RATE_LIMIT_MESSAGE }
  }

  return {
    kind: 'recovery-pending',
    message: RECOVERY_PENDING_MESSAGE,
  }
}

export function mapSignInError(error: ProviderError | null): AuthActionResult {
  if (isRateLimitError(error)) {
    return { kind: 'error', message: RATE_LIMIT_MESSAGE }
  }

  if (
    error?.code === 'invalid_credentials' ||
    error?.code === 'user_not_found' ||
    error?.code === 'email_not_confirmed'
  ) {
    return { kind: 'error', message: SIGN_IN_FAILURE_MESSAGE }
  }

  return { kind: 'error', message: GENERIC_FAILURE_MESSAGE }
}

export function mapCallbackFailure(error: ProviderError): AuthActionResult {
  void error

  return { kind: 'error', message: GENERIC_FAILURE_MESSAGE }
}