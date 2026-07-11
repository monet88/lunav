type ExpectedRedirectType = 'confirmation' | 'recovery'

interface CallbackClient {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{
      data: unknown
      error: unknown | null
    }>
    signOut: () => Promise<unknown>
  }
}

interface CompleteAuthCallbackInput {
  client: CallbackClient
  expectedRedirectType: ExpectedRedirectType
  requestUrl: string
  successPath: string
}

export type CallbackResult =
  | { kind: 'failure' }
  | { kind: 'success'; path: string; userId: string }

function readSingleCode(requestUrl: string): string | null {
  const codes = new URL(requestUrl).searchParams.getAll('code')

  if (codes.length !== 1) {
    return null
  }

  const code = codes[0]?.trim()
  return code ? code : null
}

function hasExpectedRedirectType(
  expectedRedirectType: ExpectedRedirectType,
  redirectType: string | null | undefined
): boolean {
  if (expectedRedirectType === 'recovery') {
    return redirectType === 'recovery'
  }

  return redirectType === null
}

function readRedirectType(data: unknown): string | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'redirectType' in data &&
    (typeof data.redirectType === 'string' || data.redirectType === null)
  ) {
    return data.redirectType
  }

  return null
}

function readUserId(data: unknown): string | null {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('user' in data) ||
    typeof data.user !== 'object' ||
    data.user === null ||
    !('id' in data.user) ||
    typeof data.user.id !== 'string'
  ) {
    return null
  }

  const userId = data.user.id.trim()
  return userId.length > 0 ? userId : null
}

export async function completeAuthCallback(
  input: CompleteAuthCallbackInput
): Promise<CallbackResult> {
  const code = readSingleCode(input.requestUrl)

  if (code === null) {
    return { kind: 'failure' }
  }

  try {
    const { data, error } = await input.client.auth.exchangeCodeForSession(code)
    const userId = readUserId(data)

    if (
      error ||
      userId === null ||
      !hasExpectedRedirectType(input.expectedRedirectType, readRedirectType(data))
    ) {
      if (!error) {
        await input.client.auth.signOut()
      }

      return { kind: 'failure' }
    }

    return { kind: 'success', path: input.successPath, userId }
  } catch {
    return { kind: 'failure' }
  }
}
