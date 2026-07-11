import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const { fetch } = globalThis

const rootDirectory = resolve(import.meta.dirname, '..')
const configPath = resolve(rootDirectory, 'supabase/config.toml')
const password = `Lunav-${randomUUID()}-9aA!`
const isWindows = process.platform === 'win32'

function fail(message) {
  throw new Error(message)
}

function formatError(error) {
  if (error instanceof AggregateError) {
    return [error.message, ...error.errors.map(formatError)].join('\n- ')
  }

  return error instanceof Error ? error.message : String(error)
}

function parseEnvironmentValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  return value
}

if (!fetch) {
  fail('Node.js fetch support is required for the profile integration gate.')
}

function readLocalSupabaseEnvironment() {
  const executable = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm'
  const arguments_ = isWindows
    ? [
        '/d',
        '/s',
        '/c',
        'pnpm dlx supabase@2.109.1 status --output env',
      ]
    : ['dlx', 'supabase@2.109.1', 'status', '--output', 'env']
  const result = spawnSync(
    executable,
    arguments_,
    {
      cwd: rootDirectory,
      encoding: 'utf8',
    }
  )

  if (result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim()
    fail(
      `Supabase local status failed.${detail ? ` ${detail}` : ' Start the Lunav stack before running this gate.'}`
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
    fail('Supabase local status did not provide the required profile test values.')
  }

  return { publishableKey, serviceRoleKey, url }
}

function readSupabaseProjectId() {
  const config = readFileSync(configPath, 'utf8')
  const match = config.match(/^project_id\s*=\s*"([^"]+)"\s*$/m)

  if (!match) {
    fail('Supabase project_id is required for the profile catalog proof.')
  }

  return match[1]
}

function queryDatabaseCatalog(query) {
  const containerName = `supabase_db_${readSupabaseProjectId()}`
  const result = spawnSync(
    'docker',
    [
      'exec',
      containerName,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-F',
      '|',
      '-c',
      query,
    ],
    { cwd: rootDirectory, encoding: 'utf8' }
  )

  if (result.status !== 0) {
    fail('Could not query the local Postgres catalog for profile security proof.')
  }

  return result.stdout.trim().split(/\r?\n/).filter(Boolean)
}

function assertDatabaseSecurityContract() {
  const rows = queryDatabaseCatalog(`
    select 'table', c.relrowsecurity, c.relforcerowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles';

    select 'policy', polname, polcmd, pg_get_expr(polqual, polrelid),
      coalesce(pg_get_expr(polwithcheck, polrelid), '')
    from pg_policy
    where polrelid = 'public.profiles'::regclass
    order by polname;

    select 'function', p.proname, p.prosecdef, p.proowner::regrole,
      coalesce(array_to_string(p.proconfig, ','), ''), r.rolbypassrls
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_roles r on r.oid = p.proowner
    where n.nspname = 'public'
      and p.proname in ('handle_new_auth_user', 'set_profile_updated_at')
    order by p.proname;

    select 'privilege', grantee, privilege_type, column_name
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee in ('anon', 'authenticated')
    order by grantee, privilege_type, column_name;

    select 'table_privilege', grantee, privilege_type
    from information_schema.table_privileges
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee in ('anon', 'authenticated')
    order by grantee, privilege_type;

    select 'function_privilege', grantee, routine_name, privilege_type
    from information_schema.routine_privileges
    where specific_schema = 'public'
      and routine_name in ('handle_new_auth_user', 'set_profile_updated_at')
      and grantee in ('PUBLIC', 'anon', 'authenticated')
    order by grantee, routine_name, privilege_type;
  `)

  const tableRow = rows.find((row) => row === 'table|t|t')
  const selectPolicy = rows.find(
    (row) =>
      row.startsWith('policy|Profiles are selectable by their owner|r|') &&
      row.includes('auth.uid()')
  )
  const updatePolicy = rows.find(
    (row) =>
      row.startsWith('policy|Profiles are updatable by their owner|w|') &&
      row.match(/auth\.uid\(\)/g)?.length === 2
  )
  const triggerFunctions = rows.filter(
    (row) =>
      row.startsWith('function|') &&
      row.includes('|t|postgres|search_path=""|t')
  )
  const authenticatedPrivileges = rows.filter((row) =>
    row.startsWith('privilege|authenticated|')
  )
  const anonymousPrivileges = rows.filter((row) =>
    row.startsWith('privilege|anon|')
  )
  const tablePrivileges = rows.filter((row) =>
    row.startsWith('table_privilege|')
  )
  const functionPrivileges = rows.filter((row) =>
    row.startsWith('function_privilege|')
  )

  if (!tableRow || !selectPolicy || !updatePolicy) {
    fail('Profile table does not have the required forced owner-scoped RLS policies.')
  }

  if (triggerFunctions.length !== 2) {
    fail(
      'Profile trigger functions must be security definer, owned by a BYPASSRLS role, and use an empty search path.'
    )
  }

  if (
    anonymousPrivileges.length !== 0 ||
    functionPrivileges.length !== 0 ||
    tablePrivileges.length !== 1 ||
    tablePrivileges[0] !== 'table_privilege|authenticated|SELECT' ||
    authenticatedPrivileges.length !== 5 ||
    !authenticatedPrivileges.includes('privilege|authenticated|UPDATE|display_name') ||
    authenticatedPrivileges.filter((row) => row.includes('|SELECT|')).length !== 4
  ) {
    fail('Profile table or trigger function grants exceed the required privileges.')
  }
}

async function requestAuth(url, key, path, options = {}) {
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

async function requestProfiles({
  accessToken,
  apiKey,
  body,
  method = 'GET',
  path = '?select=id,display_name,created_at,updated_at',
  publishableKey,
  url,
}) {
  const response = await fetch(`${url}/rest/v1/profiles${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      apikey: apiKey ?? publishableKey,
      authorization: `Bearer ${accessToken ?? publishableKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    method,
  })
  const responseBody = await response.text()

  return {
    body: responseBody.length === 0 ? undefined : JSON.parse(responseBody),
    status: response.status,
  }
}

function expectStatus(result, expectedStatus, message) {
  if (result.status !== expectedStatus) {
    fail(`${message} Expected HTTP ${expectedStatus}, received ${result.status}.`)
  }
}

function expectDenied(result, message) {
  if (![401, 403].includes(result.status)) {
    fail(`${message} Expected HTTP 401 or 403, received ${result.status}.`)
  }
}

async function createConfirmedUser(url, serviceRoleKey, email) {
  return requestAuth(url, serviceRoleKey, '/admin/users', {
    body: JSON.stringify({ email, email_confirm: true, password }),
    headers: { authorization: `Bearer ${serviceRoleKey}` },
    method: 'POST',
  })
}

async function signIn(url, publishableKey, email) {
  return requestAuth(url, publishableKey, '/token?grant_type=password', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  })
}

async function deleteUser(url, serviceRoleKey, userId) {
  const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    fail(`Could not remove local Auth fixture ${userId}.`)
  }
}

async function assertProfileDeleted(url, serviceRoleKey, userId) {
  const result = await requestProfiles({
    accessToken: serviceRoleKey,
    apiKey: serviceRoleKey,
    path: `?id=eq.${userId}&select=id`,
    publishableKey: serviceRoleKey,
    url,
  })
  expectStatus(result, 200, 'Service-role cascade verification failed.')

  if (!Array.isArray(result.body) || result.body.length !== 0) {
    fail('Deleting an Auth user did not cascade to the matching profile.')
  }
}

async function run() {
  assertDatabaseSecurityContract()
  const { publishableKey, serviceRoleKey, url } = readLocalSupabaseEnvironment()
  const suffix = randomUUID()
  const users = []
  let primaryFailure

  try {
    const signupEmail = `profile-signup-${suffix}@example.test`
    const signup = await requestAuth(url, publishableKey, '/signup', {
      body: JSON.stringify({ email: signupEmail, password }),
      method: 'POST',
    })
    const signupUser = signup.user ?? signup

    if (typeof signupUser.id !== 'string') {
      fail(
        `Self-service signup response did not contain a user id. Keys: ${Object.keys(signup).join(', ')}`
      )
    }

    users.push(signupUser.id)

    const userA = await createConfirmedUser(
      url,
      serviceRoleKey,
      `profile-a-${suffix}@example.test`
    )
    users.push(userA.id)
    const userB = await createConfirmedUser(
      url,
      serviceRoleKey,
      `profile-b-${suffix}@example.test`
    )
    users.push(userB.id)

    const sessionA = await signIn(url, publishableKey, userA.email)
    const sessionB = await signIn(url, publishableKey, userB.email)

    const signupProfile = await requestProfiles({
      accessToken: serviceRoleKey,
      apiKey: serviceRoleKey,
      path: `?id=eq.${signupUser.id}&select=id,display_name`,
      publishableKey,
      url,
    })
    expectStatus(signupProfile, 200, 'Self-service signup profile lookup failed.')

    if (
      !Array.isArray(signupProfile.body) ||
      signupProfile.body.length !== 1 ||
      signupProfile.body[0].id !== signupUser.id ||
      signupProfile.body[0].display_name !== null
    ) {
      fail('Self-service signup did not create exactly one profile.')
    }

    const anonymousSelect = await requestProfiles({ publishableKey, url })
    expectDenied(anonymousSelect, 'Anonymous profile selection was not denied.')

    for (const [operation, request] of [
      [
        'insert',
        {
          body: { id: randomUUID(), display_name: 'Anonymous Insert' },
          method: 'POST',
          path: '?select=id',
        },
      ],
      [
        'update',
        {
          body: { display_name: 'Anonymous Update' },
          method: 'PATCH',
          path: `?id=eq.${userA.id}&select=id`,
        },
      ],
      [
        'delete',
        {
          method: 'DELETE',
          path: `?id=eq.${userA.id}&select=id`,
        },
      ],
    ]) {
      const result = await requestProfiles({
        ...request,
        publishableKey,
        url,
      })
      expectDenied(result, `Anonymous profile ${operation} was not denied.`)
    }

    const ownerSelect = await requestProfiles({
      accessToken: sessionA.access_token,
      publishableKey,
      url,
    })
    expectStatus(ownerSelect, 200, 'Profile trigger did not create an owner row.')

    if (
      !Array.isArray(ownerSelect.body) ||
      ownerSelect.body.length !== 1 ||
      ownerSelect.body[0].id !== userA.id ||
      ownerSelect.body[0].display_name !== null ||
      typeof ownerSelect.body[0].created_at !== 'string' ||
      typeof ownerSelect.body[0].updated_at !== 'string'
    ) {
      fail('Owner selection did not return exactly one private profile.')
    }

    const initialCreatedAt = ownerSelect.body[0].created_at
    const initialUpdatedAt = ownerSelect.body[0].updated_at

    const crossUserSelect = await requestProfiles({
      accessToken: sessionB.access_token,
      path: `?id=eq.${userA.id}&select=id`,
      publishableKey,
      url,
    })
    expectStatus(crossUserSelect, 200, 'Cross-user selection did not apply RLS.')

    if (!Array.isArray(crossUserSelect.body) || crossUserSelect.body.length !== 0) {
      fail('A user could read another user profile.')
    }

    const ownerUpdate = await requestProfiles({
      accessToken: sessionA.access_token,
      body: { display_name: 'Nguyen An' },
      method: 'PATCH',
      path: `?id=eq.${userA.id}&select=id,display_name,created_at,updated_at`,
      publishableKey,
      url,
    })
    expectStatus(ownerUpdate, 200, 'Owner display name update failed.')

    if (
      !Array.isArray(ownerUpdate.body) ||
      ownerUpdate.body.length !== 1 ||
      ownerUpdate.body[0].display_name !== 'Nguyen An' ||
      ownerUpdate.body[0].created_at !== initialCreatedAt ||
      typeof ownerUpdate.body[0].updated_at !== 'string' ||
      Number.isNaN(Date.parse(ownerUpdate.body[0].updated_at)) ||
      ownerUpdate.body[0].updated_at === initialUpdatedAt
    ) {
      fail('Owner update did not return the profile with a new server timestamp.')
    }

    for (const [label, displayName] of [
      ['overlong', 'a'.repeat(101)],
      ['leading whitespace', ' Nguyen An'],
      ['trailing whitespace', 'Nguyen An '],
      ['whitespace only', '\t'],
      ['NEL boundary whitespace', '\u0085Nguyen An'],
      ['BOM boundary whitespace', 'Nguyen An\uFEFF'],
      ['NUL-containing', 'Nguyen\u0000 An'],
    ]) {
      const invalidDisplayName = await requestProfiles({
        accessToken: sessionA.access_token,
        body: { display_name: displayName },
        method: 'PATCH',
        path: `?id=eq.${userA.id}&select=id`,
        publishableKey,
        url,
      })

      if (invalidDisplayName.status !== 400) {
        fail(
          `Database accepted an ${label} display name. Expected HTTP 400, received ${invalidDisplayName.status}.`
        )
      }
    }

    const crossUserUpdate = await requestProfiles({
      accessToken: sessionB.access_token,
      body: { display_name: 'Cross User' },
      method: 'PATCH',
      path: `?id=eq.${userA.id}&select=id,display_name`,
      publishableKey,
      url,
    })
    expectStatus(crossUserUpdate, 200, 'Cross-user update did not apply RLS.')

    if (!Array.isArray(crossUserUpdate.body) || crossUserUpdate.body.length !== 0) {
      fail('A user could update another user profile.')
    }

    const crossUserDelete = await requestProfiles({
      accessToken: sessionB.access_token,
      method: 'DELETE',
      path: `?id=eq.${userA.id}&select=id`,
      publishableKey,
      url,
    })
    expectDenied(crossUserDelete, 'Cross-user profile deletion was not denied.')

    const insertAttempt = await requestProfiles({
      accessToken: sessionA.access_token,
      body: { id: randomUUID(), display_name: 'Injected Profile' },
      method: 'POST',
      path: '?select=id',
      publishableKey,
      url,
    })
    expectDenied(insertAttempt, 'Authenticated profile insertion was not denied.')

    const duplicateAttempt = await requestProfiles({
      accessToken: serviceRoleKey,
      apiKey: serviceRoleKey,
      body: { id: userA.id, display_name: 'Duplicate Profile' },
      method: 'POST',
      path: '?select=id',
      publishableKey,
      url,
    })

    if (duplicateAttempt.status !== 409) {
      fail(
        `Duplicate profile creation was not rejected. Expected HTTP 409, received ${duplicateAttempt.status}.`
      )
    }

    const deleteAttempt = await requestProfiles({
      accessToken: sessionA.access_token,
      method: 'DELETE',
      path: `?id=eq.${userA.id}&select=id`,
      publishableKey,
      url,
    })
    expectDenied(deleteAttempt, 'Authenticated profile deletion was not denied.')

    for (const [field, value] of [
      ['id', randomUUID()],
      ['created_at', '2026-01-01T00:00:00.000Z'],
      ['updated_at', '2026-01-01T00:00:00.000Z'],
    ]) {
      const immutableUpdate = await requestProfiles({
        accessToken: sessionA.access_token,
        body: { [field]: value },
        method: 'PATCH',
        path: `?id=eq.${userA.id}&select=id`,
        publishableKey,
        url,
      })
      expectDenied(
        immutableUpdate,
        `Authenticated mutation of ${field} was not denied.`
      )
    }

    const finalOwnerSelect = await requestProfiles({
      accessToken: sessionA.access_token,
      publishableKey,
      url,
    })
    expectStatus(finalOwnerSelect, 200, 'Final owner profile selection failed.')

    if (
      !Array.isArray(finalOwnerSelect.body) ||
      finalOwnerSelect.body.length !== 1 ||
      finalOwnerSelect.body[0].id !== userA.id ||
      finalOwnerSelect.body[0].display_name !== 'Nguyen An'
    ) {
      fail('Denied profile mutations changed the owner profile.')
    }
  } catch (error) {
    primaryFailure = error
  }

  const cleanupResults = await Promise.allSettled(
    users.map(async (userId) => {
      try {
        await deleteUser(url, serviceRoleKey, userId)
        await assertProfileDeleted(url, serviceRoleKey, userId)
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        throw new Error(`Auth fixture ${userId}: ${detail}`, { cause: error })
      }
    })
  )
  const cleanupFailures = cleanupResults.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : []
  )

  if (primaryFailure !== undefined && cleanupFailures.length > 0) {
    throw new AggregateError(
      [primaryFailure, ...cleanupFailures],
      'Profile integration and fixture cleanup both failed.'
    )
  }

  if (primaryFailure !== undefined) {
    throw primaryFailure
  }

  if (cleanupFailures.length > 0) {
    throw new AggregateError(
      cleanupFailures,
      `Could not clean up ${cleanupFailures.length} local Auth fixture${cleanupFailures.length === 1 ? '' : 's'}.`
    )
  }
}

run().catch((error) => {
  console.error(formatError(error))
  process.exitCode = 1
})