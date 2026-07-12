import {
  updateProfileDisplayName,
  type ProfileSupabaseClient,
} from './update-profile'

const USER_ID = 'd102d9ea-7875-4cf4-9f01-094d8182e182'

function createProfileClient(options?: {
  data?: unknown
  error?: unknown | null
  throwOnUpdate?: boolean
}): {
  client: ProfileSupabaseClient
  eq: jest.Mock
  from: jest.Mock
  select: jest.Mock
  single: jest.Mock
  update: jest.Mock
} {
  const single = jest.fn().mockResolvedValue({
    data:
      options?.data ??
      {
        id: USER_ID,
        display_name: 'Minh',
        created_at: '2026-07-11T00:00:00.000Z',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    error: options?.error ?? null,
  })
  const select = jest.fn().mockReturnValue({ single })
  const eq = jest.fn().mockReturnValue({ select })
  const update = options?.throwOnUpdate
    ? jest.fn(() => {
        throw new Error('network down')
      })
    : jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ update })

  return {
    client: { from },
    eq,
    from,
    select,
    single,
    update,
  }
}

describe('updateProfileDisplayName', () => {
  test('does not query or update a profile before an authenticated identity is resolved', async () => {
    const { client, from } = createProfileClient()

    const state = await updateProfileDisplayName(
      client,
      { status: 'anonymous' },
      { displayName: 'Minh' }
    )

    expect(state).toEqual({
      kind: 'error',
      message: 'Vui long dang nhap lai de tiep tuc.',
    })
    expect(from).not.toHaveBeenCalled()
  })

  test('rejects unconfirmed sessions without touching profiles', async () => {
    const { client, from } = createProfileClient()

    const state = await updateProfileDisplayName(
      client,
      {
        status: 'unconfirmed',
        identity: {
          userId: USER_ID,
          email: 'member@example.com',
          isEmailConfirmed: false,
        },
      },
      { displayName: 'Minh' }
    )

    expect(state).toEqual({
      kind: 'error',
      message: 'Vui long dang nhap lai de tiep tuc.',
    })
    expect(from).not.toHaveBeenCalled()
  })

  test('updates only display_name for the verified user and parses the returned row', async () => {
    const { client, eq, from, update } = createProfileClient()

    const state = await updateProfileDisplayName(
      client,
      {
        status: 'authenticated',
        identity: {
          userId: USER_ID,
          email: 'minh@example.com',
          isEmailConfirmed: true,
        },
      },
      { displayName: ' Minh ' }
    )

    expect(from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith({ display_name: 'Minh' })
    expect(eq).toHaveBeenCalledWith('id', USER_ID)
    expect(state).toEqual({
      kind: 'success',
      message: 'Thong tin da duoc cap nhat.',
      profile: {
        userId: USER_ID,
        displayName: 'Minh',
        createdAt: '2026-07-11T00:00:00.000Z',
        updatedAt: '2026-07-11T00:00:00.000Z',
      },
    })
  })

  test('rejects invalid display names without calling Supabase', async () => {
    const { client, from } = createProfileClient()

    const state = await updateProfileDisplayName(
      client,
      {
        status: 'authenticated',
        identity: {
          userId: USER_ID,
          email: 'minh@example.com',
          isEmailConfirmed: true,
        },
      },
      { displayName: 'a'.repeat(101) }
    )

    expect(state).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(from).not.toHaveBeenCalled()
  })

  test('maps provider and parse failures to a generic update error', async () => {
    const missingRow = createProfileClient({ data: null, error: { code: 'PGRST116' } })
    const brokenRow = createProfileClient({
      data: {
        id: USER_ID,
        display_name: 'Minh',
        created_at: 'not-a-datetime',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
    })
    const transport = createProfileClient({ throwOnUpdate: true })
    const auth = {
      status: 'authenticated' as const,
      identity: {
        userId: USER_ID,
        email: 'minh@example.com',
        isEmailConfirmed: true,
      },
    }

    await expect(
      updateProfileDisplayName(missingRow.client, auth, { displayName: 'Minh' })
    ).resolves.toEqual({
      kind: 'error',
      message: 'Khong the cap nhat thong tin. Vui long thu lai.',
    })
    await expect(
      updateProfileDisplayName(brokenRow.client, auth, { displayName: 'Minh' })
    ).resolves.toEqual({
      kind: 'error',
      message: 'Khong the cap nhat thong tin. Vui long thu lai.',
    })
    await expect(
      updateProfileDisplayName(transport.client, auth, { displayName: 'Minh' })
    ).resolves.toEqual({
      kind: 'error',
      message: 'Khong the cap nhat thong tin. Vui long thu lai.',
    })
  })
})
