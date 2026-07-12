import type { AuthState } from '@lunav/contracts'
import { render, screen } from '@testing-library/react-native'
import IndexRoute from '@/app/index'

const mockRedirect = jest.fn()

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    mockRedirect({ href })
    // Avoid out-of-scope JSX imports inside jest.mock factory.
    return {
      $$typeof: Symbol.for('react.transitional.element'),
      type: 'Text',
      key: null,
      ref: null,
      props: {
        testID: 'redirect-target',
        children: href,
      },
    }
  },
}))

jest.mock('@/features/auth/session-provider', () => ({
  useAuthState: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
  createMobileSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/supabase/config', () => ({
  getMobileSupabaseConfig: jest.fn(() => ({
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_public',
  })),
}))

const { useAuthState } = jest.requireMock(
  '@/features/auth/session-provider'
) as {
  useAuthState: jest.Mock<AuthState, []>
}

async function renderIndex(state: AuthState) {
  useAuthState.mockReturnValue(state)
  return render(<IndexRoute />)
}

describe('IndexRoute auth entry redirects', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    useAuthState.mockReset()
  })

  test('shows a safe loading surface while auth is unresolved', async () => {
    await renderIndex({ status: 'loading' })

    expect(screen.getByTestId('auth-loading-screen')).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  test('redirects anonymous users to the public auth shell', async () => {
    await renderIndex({ status: 'anonymous' })

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)' })
  })

  test('redirects unconfirmed sessions to the public auth shell', async () => {
    await renderIndex({
      status: 'unconfirmed',
      identity: {
        userId: 'user-b',
        email: 'b@example.com',
        isEmailConfirmed: false,
      },
    })

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)' })
  })

  test('redirects confirmed authenticated users to the private shell', async () => {
    await renderIndex({
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    })

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(protected)' })
  })
})
