import {
  loadOwnerProfile,
  type ProfileReadClient,
} from './load-profile'

const USER_ID = 'd102d9ea-7875-4cf4-9f01-094d8182e182'

function createReadClient(options?: {
  data?: unknown
  error?: unknown | null
  throwOnFrom?: boolean
}): {
  client: ProfileReadClient
  eq: jest.Mock
  from: jest.Mock
  select: jest.Mock
  single: jest.Mock
} {
  const single = jest.fn().mockResolvedValue({
    data:
      options?.data ??
      {
        id: USER_ID,
        display_name: 'Nguyen An',
        created_at: '2026-07-11T00:00:00.000Z',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    error: options?.error ?? null,
  })
  const eq = jest.fn().mockReturnValue({ single })
  const select = jest.fn().mockReturnValue({ eq })
  const from = options?.throwOnFrom
    ? jest.fn(() => {
        throw new Error('network down')
      })
    : jest.fn().mockReturnValue({ select })

  return { client: { from }, eq, from, select, single }
}

describe('loadOwnerProfile', () => {
  test('does not query profiles without an authenticated identity', async () => {
    const { client, from } = createReadClient()

    const result = await loadOwnerProfile(client, { status: 'anonymous' })

    expect(result).toEqual({
      kind: 'unauthorized',
      message: 'Vui long dang nhap lai de tiep tuc.',
    })
    expect(from).not.toHaveBeenCalled()
  })

  test('loads and parses only the owner-scoped profile row', async () => {
    const { client, eq, from, select } = createReadClient()

    const result = await loadOwnerProfile(client, {
      status: 'authenticated',
      identity: {
        userId: USER_ID,
        email: 'member@example.com',
        isEmailConfirmed: true,
      },
    })

    expect(from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', USER_ID)
    expect(result).toEqual({
      kind: 'loaded',
      profile: {
        userId: USER_ID,
        displayName: 'Nguyen An',
        createdAt: '2026-07-11T00:00:00.000Z',
        updatedAt: '2026-07-11T00:00:00.000Z',
      },
    })
  })

  test('maps missing rows and parse failures without leaking other-user data', async () => {
    const missing = createReadClient({ data: null, error: { code: 'PGRST116' } })
    const invalid = createReadClient({
      data: {
        id: USER_ID,
        display_name: 'x',
        created_at: 'bad',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    })
    const transport = createReadClient({ throwOnFrom: true })
    const auth = {
      status: 'authenticated' as const,
      identity: {
        userId: USER_ID,
        email: 'member@example.com',
        isEmailConfirmed: true,
      },
    }

    await expect(loadOwnerProfile(missing.client, auth)).resolves.toEqual({
      kind: 'error',
      message: 'Khong the tai thong tin tai khoan. Vui long thu lai.',
    })
    await expect(loadOwnerProfile(invalid.client, auth)).resolves.toEqual({
      kind: 'error',
      message: 'Khong the tai thong tin tai khoan. Vui long thu lai.',
    })
    await expect(loadOwnerProfile(transport.client, auth)).resolves.toEqual({
      kind: 'error',
      message: 'Khong the tai thong tin tai khoan. Vui long thu lai.',
    })
  })
})
