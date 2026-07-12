import type { AuthState } from '@lunav/contracts'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'
import type {
  MobileAuthStateController,
  SignOutCleanup,
} from '@/lib/supabase/auth-state-controller'
import {
  MobileAuthSessionProvider,
  useAuthState,
  useSignOut,
} from './session-provider'

jest.mock('@/lib/supabase/client', () => ({
  createMobileSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/supabase/config', () => ({
  getMobileSupabaseConfig: jest.fn(() => ({
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_public',
  })),
}))

function createControllerHarness(initial: AuthState = { status: 'loading' }): {
  controller: MobileAuthStateController
  emit: (state: AuthState) => void
  signOut: jest.Mock
  start: jest.Mock
  stop: jest.Mock
} {
  let state = initial
  const listeners = new Set<(next: AuthState) => void>()
  const signOut = jest.fn(async () => {
    state = { status: 'anonymous' }
    listeners.forEach((listener) => listener(state))
  })
  const start = jest.fn(async () => undefined)
  const stop = jest.fn(async () => undefined)

  return {
    controller: {
      getState: () => state,
      signOut,
      start,
      stop,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
    },
    emit: (next) => {
      state = next
      listeners.forEach((listener) => listener(next))
    },
    signOut,
    start,
    stop,
  }
}

function AuthStateProbe() {
  const state = useAuthState()
  const label =
    state.status === 'authenticated' || state.status === 'unconfirmed'
      ? `${state.status}:${state.identity.email}`
      : state.status

  return <Text testID="auth-state">{label}</Text>
}

function SignOutProbe() {
  const signOut = useSignOut()

  return (
    <Pressable accessibilityRole="button" onPress={() => void signOut()}>
      <Text>Sign out</Text>
    </Pressable>
  )
}

describe('MobileAuthSessionProvider', () => {
  test('starts the controller and exposes loading then authenticated state', async () => {
    const harness = createControllerHarness({ status: 'loading' })

    await render(
      <MobileAuthSessionProvider controller={harness.controller}>
        <AuthStateProbe />
      </MobileAuthSessionProvider>
    )

    expect(screen.getByTestId('auth-state')).toHaveTextContent('loading')
    expect(harness.start).toHaveBeenCalledTimes(1)

    await act(async () => {
      harness.emit({
        status: 'authenticated',
        identity: {
          userId: 'user-a',
          email: 'a@example.com',
          isEmailConfirmed: true,
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'authenticated:a@example.com'
      )
    })
  })

  test('wires sign-out through ordered cleanup before session clear', async () => {
    const harness = createControllerHarness({
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    })
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => undefined),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }

    await render(
      <MobileAuthSessionProvider
        controller={harness.controller}
        cleanup={cleanup}
      >
        <SignOutProbe />
      </MobileAuthSessionProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign out' }))
    })

    await waitFor(() => {
      expect(harness.signOut).toHaveBeenCalledWith(cleanup)
    })
  })

  test('stops the controller on unmount', async () => {
    const harness = createControllerHarness()

    const view = await render(
      <MobileAuthSessionProvider controller={harness.controller}>
        <AuthStateProbe />
      </MobileAuthSessionProvider>
    )

    await waitFor(() => {
      expect(harness.start).toHaveBeenCalledTimes(1)
    })

    view.unmount()

    await waitFor(() => {
      expect(harness.stop).toHaveBeenCalledTimes(1)
    })
  })

  test('falls back to anonymous when controller start fails', async () => {
    const harness = createControllerHarness({ status: 'loading' })
    harness.start.mockRejectedValueOnce(new Error('subscription unavailable'))

    await render(
      <MobileAuthSessionProvider controller={harness.controller}>
        <AuthStateProbe />
      </MobileAuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    })
  })
})
