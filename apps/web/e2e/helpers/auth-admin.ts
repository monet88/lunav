import type { LocalSupabaseEnvironment } from './local-env'

export async function deleteAuthUser(
  environment: LocalSupabaseEnvironment,
  userId: string | null | undefined
): Promise<void> {
  if (!userId) {
    return
  }

  await fetch(`${environment.url}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: environment.serviceRoleKey,
      authorization: `Bearer ${environment.serviceRoleKey}`,
    },
    method: 'DELETE',
  })
}

export async function findAuthUserIdByEmail(
  environment: LocalSupabaseEnvironment,
  email: string
): Promise<string | null> {
  const response = await fetch(
    `${environment.url}/auth/v1/admin/users?page=1&per_page=200`,
    {
      headers: {
        apikey: environment.serviceRoleKey,
        authorization: `Bearer ${environment.serviceRoleKey}`,
      },
      method: 'GET',
    }
  )

  if (!response.ok) {
    throw new Error(`Admin user lookup failed with HTTP ${response.status}.`)
  }

  const body = (await response.json()) as {
    users?: Array<{ id?: string; email?: string }>
  }
  const match = body.users?.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  )

  return match?.id ?? null
}
