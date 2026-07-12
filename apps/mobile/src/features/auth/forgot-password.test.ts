import {
  requestPasswordRecovery,
  type ForgotPasswordAuthClient,
} from './forgot-password'

function createClient(result?: {
  error: { code?: string; message?: string } | null
}): {
  client: ForgotPasswordAuthClient
  resetPasswordForEmail: jest.Mock
} {
  const resetPasswordForEmail = jest
    .fn()
    .mockResolvedValue(result ?? { error: null })

  return {
    client: {
      auth: {
        resetPasswordForEmail,
      },
    },
    resetPasswordForEmail,
  }
}

describe('mobile forgot-password request', () => {
  test('rejects invalid email without calling Supabase', async () => {
    const { client, resetPasswordForEmail } = createClient()

    const result = await requestPasswordRecovery(client, {
      email: 'not-an-email',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  test('uses the local recovery deep link and returns enumeration-safe pending copy', async () => {
    const { client, resetPasswordForEmail } = createClient({
      error: { code: 'user_not_found', message: 'provider detail' },
    })

    const result = await requestPasswordRecovery(client, {
      email: 'member@example.com',
    })

    expect(resetPasswordForEmail).toHaveBeenCalledWith('member@example.com', {
      redirectTo: 'lunav://auth/recovery',
    })
    expect(result).toEqual({
      kind: 'recovery-pending',
      message:
        'Neu dia chi email hop le, ban se nhan duoc huong dan dat lai mat khau.',
    })
  })

  test('maps recovery rate limits without claiming email was sent', async () => {
    const { client } = createClient({
      error: { code: 'over_email_send_rate_limit', message: 'rate limit' },
    })

    const result = await requestPasswordRecovery(client, {
      email: 'member@example.com',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('maps unexpected recovery provider errors without claiming email was sent', async () => {
    const { client } = createClient({
      error: { code: 'unexpected_failure', message: 'smtp down' },
    })

    const result = await requestPasswordRecovery(client, {
      email: 'member@example.com',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })

  test('maps transport exceptions as a generic failure, not a form error', async () => {
    const resetPasswordForEmail = jest
      .fn()
      .mockRejectedValue(new Error('network down'))
    const client: ForgotPasswordAuthClient = {
      auth: { resetPasswordForEmail },
    }

    const result = await requestPasswordRecovery(client, {
      email: 'member@example.com',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
    expect(resetPasswordForEmail).toHaveBeenCalled()
  })
})
