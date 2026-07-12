import { act, render, waitFor } from '@testing-library/react-native'
import { ConfirmCallbackScreen } from './ConfirmCallbackScreen'

function createClient(result: {
  data: { redirectType: string | null; user?: { id: string } | null }
  error: { code: string } | null
}) {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue(result),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }
}

describe('ConfirmCallbackScreen', () => {
  test('replaces navigation with the success path after a valid exchange', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })
    const replace = jest.fn()

    await act(async () => {
      render(
        <ConfirmCallbackScreen
          client={client}
          navigation={{ replace }}
          requestUrl="lunav://auth/confirm?code=valid-code"
          successPath="/"
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/')
    })
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'valid-code'
    )
  })

  test('replaces navigation with the failure path when the code is missing', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })
    const replace = jest.fn()

    await act(async () => {
      render(
        <ConfirmCallbackScreen
          client={client}
          navigation={{ replace }}
          requestUrl={null}
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/confirm-failed')
    })
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  test('fails closed for wrong-flow codes and still replaces history', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-1' } },
      error: null,
    })
    const replace = jest.fn()

    await act(async () => {
      render(
        <ConfirmCallbackScreen
          client={client}
          navigation={{ replace }}
          requestUrl="lunav://auth/confirm?code=recovery-code"
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/confirm-failed')
    })
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
  })
})
