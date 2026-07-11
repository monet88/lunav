import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const { fetch } = globalThis

const rootDirectory = resolve(import.meta.dirname, '..')
const configPath = resolve(rootDirectory, 'supabase/config.toml')
const password = `Lunav-${randomUUID()}-9aA!`

function fail(message) {
  throw new Error(message)
}

function parseEnvironmentValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  return value
}

if (!fetch) {
  fail('Node.js fetch support is required for the Auth integration gate.')
}

function readLocalSupabaseEnvironment() {
  const result = spawnSync('supabase', ['status', '--output', 'env'], {
    cwd: rootDirectory,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    fail(
      'Supabase local is unavailable. Start the Lunav stack before running this gate.'
    )
  }

  const environment = Object.fromEntries(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.match(/^([^=]+)=(.*)$/))
      .filter((match) => match !== null)
      .map((match) => [match[1], parseEnvironmentValue(match[2])])
  )

  const url = environment.API_URL
  const publishableKey = environment.ANON_KEY
  const serviceRoleKey = environment.SERVICE_ROLE_KEY

  if (!url || !publishableKey || !serviceRoleKey) {
    fail('Supabase local status did not provide the required Auth test values.')
  }

  return { publishableKey, serviceRoleKey, url }
}

async function request(url, key, path, options = {}) {
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      'content-type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    fail(`Local Auth request failed with HTTP ${response.status}.`)
  }

  const body = await response.text()

  return body.length === 0 ? undefined : JSON.parse(body)
}

function assertEmailConfirmationEnabled() {
  const config = readFileSync(configPath, 'utf8')

  if (!/^enable_confirmations\s*=\s*true\s*$/m.test(config)) {
    fail('Local Auth email confirmation must be enabled.')
  }
}

async function run() {
  assertEmailConfirmationEnabled()
  const { publishableKey, serviceRoleKey, url } = readLocalSupabaseEnvironment()
  const suffix = randomUUID()
  const unconfirmedEmail = `unconfirmed-${suffix}@example.test`
  const confirmedEmail = `confirmed-${suffix}@example.test`
  let unconfirmedUserId
  let confirmedUserId

  try {
    const unconfirmedSignup = await request(url, publishableKey, '/signup', {
      body: JSON.stringify({ email: unconfirmedEmail, password }),
      method: 'POST',
    })

    unconfirmedUserId = unconfirmedSignup.user?.id

    if (
      unconfirmedSignup.user?.email_confirmed_at != null ||
      unconfirmedSignup.session != null
    ) {
      fail('Unconfirmed signup unexpectedly received private session access.')
    }

    const confirmedUser = await request(url, serviceRoleKey, '/admin/users', {
      body: JSON.stringify({
        email: confirmedEmail,
        email_confirm: true,
        password,
      }),
      headers: { authorization: `Bearer ${serviceRoleKey}` },
      method: 'POST',
    })
    confirmedUserId = confirmedUser.id

    const signIn = await request(url, publishableKey, '/token?grant_type=password', {
      body: JSON.stringify({ email: confirmedEmail, password }),
      method: 'POST',
    })

    if (!signIn.access_token || !signIn.refresh_token) {
      fail('Confirmed account did not receive a local Auth session.')
    }

    const currentUser = await request(url, publishableKey, '/user', {
      headers: { authorization: `Bearer ${signIn.access_token}` },
      method: 'GET',
    })

    if (currentUser.id !== confirmedUserId || currentUser.email_confirmed_at == null) {
      fail('Current user was not the expected confirmed local identity.')
    }

    const refreshed = await request(url, publishableKey, '/token?grant_type=refresh_token', {
      body: JSON.stringify({ refresh_token: signIn.refresh_token }),
      method: 'POST',
    })

    if (!refreshed.access_token || !refreshed.refresh_token) {
      fail('Local Auth refresh did not return a replacement session.')
    }

    await request(url, publishableKey, '/logout', {
      headers: { authorization: `Bearer ${refreshed.access_token}` },
      method: 'POST',
    })

    const loggedOutUser = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${refreshed.access_token}`,
      },
      method: 'GET',
    })

    if (loggedOutUser.ok) {
      fail('Local Auth logout did not invalidate the current session.')
    }
  } finally {
    const userIds = [unconfirmedUserId, confirmedUserId].filter(Boolean)

    await Promise.all(
      userIds.map((userId) =>
        fetch(`${url}/auth/v1/admin/users/${userId}`, {
          headers: {
            apikey: serviceRoleKey,
            authorization: `Bearer ${serviceRoleKey}`,
          },
          method: 'DELETE',
        })
      )
    )
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : 'Auth integration gate failed.'
  console.error(message)
  process.exitCode = 1
})
