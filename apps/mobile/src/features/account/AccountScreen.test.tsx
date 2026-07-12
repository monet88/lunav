import type { AuthState } from '@lunav/contracts'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { AccountScreen, type AccountScreenClient } from './AccountScreen'

const USER_ID = 'd102d9ea-7875-4cf4-9f01-094d8182e182'

const authenticated: AuthState = {
  status: 'authenticated',
  identity: {
    userId: USER_ID,
    email: 'member@example.com',
    isEmailConfirmed: true,
  },
}

function createClient(options?: {
  loadData?: unknown
  loadError?: unknown | null
  updateData?: unknown
  updateError?: unknown | null
}): {
  client: AccountScreenClient
  from: jest.Mock
  update: jest.Mock
  updateEq: jest.Mock
} {
  const loadSingle = jest.fn().mockResolvedValue({
    data:
      options?.loadData ??
      {
        id: USER_ID,
        display_name: 'Nguyen An',
        created_at: '2026-07-11T00:00:00.000Z',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    error: options?.loadError ?? null,
  })
  const loadEq = jest.fn().mockReturnValue({ single: loadSingle })
  const select = jest.fn().mockReturnValue({ eq: loadEq })

  const updateSingle = jest.fn().mockResolvedValue({
    data:
      options?.updateData ??
      {
        id: USER_ID,
        display_name: 'Minh',
        created_at: '2026-07-11T00:00:00.000Z',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    error: options?.updateError ?? null,
  })
  const updateSelect = jest.fn().mockReturnValue({ single: updateSingle })
  const updateEq = jest.fn().mockReturnValue({ select: updateSelect })
  const update = jest.fn().mockReturnValue({ eq: updateEq })

  const from = jest.fn().mockReturnValue({ select, update })

  return {
    client: { from },
    from,
    update,
    updateEq,
  }
}

describe('AccountScreen', () => {
  test('requires authenticated state and shows read-only identity fields', async () => {
    const { client } = createClient()
    const onSignOut = jest.fn(async () => undefined)
    const onNavigatePublic = jest.fn()

    await render(
      <AccountScreen
        authState={{ status: 'anonymous' }}
        client={client}
        onNavigatePublic={onNavigatePublic}
        onSignOut={onSignOut}
      />
    )

    expect(screen.getByTestId('account-status')).toHaveTextContent(
      'Vui long dang nhap lai de tiep tuc.'
    )
    expect(screen.queryByTestId('profile-form')).toBeNull()
    expect(client.from).not.toHaveBeenCalled()
  })

  test('loads owner profile and saves only display_name', async () => {
    const { client, update, updateEq } = createClient()
    const onSignOut = jest.fn(async () => undefined)
    const onNavigatePublic = jest.fn()

    await render(
      <AccountScreen
        authState={authenticated}
        client={client}
        onNavigatePublic={onNavigatePublic}
        onSignOut={onSignOut}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('profile-display-name')).toBeTruthy()
    })

    expect(screen.getByTestId('account-email')).toHaveTextContent(
      'member@example.com'
    )
    expect(screen.getByTestId('account-confirmation')).toHaveTextContent(
      'Da xac nhan'
    )

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('profile-display-name'), ' Minh ')
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('profile-submit'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-status')).toHaveTextContent(
        'Thong tin da duoc cap nhat.'
      )
    })

    expect(update).toHaveBeenCalledWith({ display_name: 'Minh' })
    expect(updateEq).toHaveBeenCalledWith('id', USER_ID)
  })

  test('sign-out clears session before navigating public', async () => {
    const { client } = createClient()
    const callOrder: string[] = []
    const onSignOut = jest.fn(async () => {
      callOrder.push('sign-out')
    })
    const onNavigatePublic = jest.fn(() => {
      callOrder.push('navigate-public')
    })

    await render(
      <AccountScreen
        authState={authenticated}
        client={client}
        onNavigatePublic={onNavigatePublic}
        onSignOut={onSignOut}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('account-sign-out')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('account-sign-out'))
    })

    await waitFor(() => {
      expect(onSignOut).toHaveBeenCalledTimes(1)
      expect(onNavigatePublic).toHaveBeenCalledTimes(1)
    })
    expect(callOrder).toEqual(['sign-out', 'navigate-public'])
  })

  test('does not navigate public when sign-out fails', async () => {
    const { client } = createClient()
    const onSignOut = jest.fn(async () => {
      throw new Error('cleanup failed')
    })
    const onNavigatePublic = jest.fn()

    await render(
      <AccountScreen
        authState={authenticated}
        client={client}
        onNavigatePublic={onNavigatePublic}
        onSignOut={onSignOut}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('account-sign-out')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('account-sign-out'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('account-sign-out-status')).toHaveTextContent(
        'Khong the dang xuat. Vui long thu lai.'
      )
    })
    expect(screen.getByTestId('profile-form')).toBeTruthy()
    expect(onNavigatePublic).not.toHaveBeenCalled()
  })
})
