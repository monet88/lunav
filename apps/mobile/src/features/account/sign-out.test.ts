import { signOutToPublic } from './sign-out'

describe('signOutToPublic', () => {
  test('runs ordered cleanup via signOut then navigates to the public auth shell', async () => {
    const callOrder: string[] = []
    const signOut = jest.fn(async () => {
      callOrder.push('sign-out')
    })
    const replace = jest.fn((href: '/(auth)') => {
      callOrder.push(`replace:${href}`)
    })

    await signOutToPublic({ signOut, replace })

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/(auth)')
    expect(callOrder).toEqual(['sign-out', 'replace:/(auth)'])
  })

  test('does not navigate public when sign-out fails', async () => {
    const signOut = jest.fn(async () => {
      throw new Error('cleanup failed')
    })
    const replace = jest.fn()

    await expect(signOutToPublic({ signOut, replace })).rejects.toThrow(
      'cleanup failed'
    )
    expect(replace).not.toHaveBeenCalled()
  })
})
