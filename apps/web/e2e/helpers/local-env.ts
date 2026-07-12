import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

export interface LocalSupabaseEnvironment {
  mailpitUrl: string
  publishableKey: string
  serviceRoleKey: string
  url: string
  webOrigin: string
}

function parseEnvironmentValue(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  return value
}

function readStatusEnvironment(): Record<string, string> {
  const rootDirectory = resolve(process.cwd(), '../..')
  const result = spawnSync('supabase', ['status', '--output', 'env'], {
    cwd: rootDirectory,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(
      'Supabase local is unavailable. Start the Lunav stack before running web auth E2E.'
    )
  }

  return Object.fromEntries(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.match(/^([^=]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => [match[1], parseEnvironmentValue(match[2])])
  )
}

export function readLocalSupabaseEnvironment(): LocalSupabaseEnvironment {
  const environment = readStatusEnvironment()
  const url = environment.API_URL
  const publishableKey = environment.ANON_KEY ?? environment.PUBLISHABLE_KEY
  const serviceRoleKey = environment.SERVICE_ROLE_KEY ?? environment.SECRET_KEY
  const mailpitUrl = environment.MAILPIT_URL ?? environment.INBUCKET_URL
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3000'

  if (!url || !publishableKey || !serviceRoleKey || !mailpitUrl) {
    throw new Error(
      'Supabase local status did not provide the required Auth E2E values.'
    )
  }

  return {
    mailpitUrl: mailpitUrl.replace(/\/$/, ''),
    publishableKey,
    serviceRoleKey,
    url: url.replace(/\/$/, ''),
    webOrigin: webOrigin.replace(/\/$/, ''),
  }
}

export function toWebProcessEnvironment(
  environment: LocalSupabaseEnvironment
): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: environment.publishableKey,
    NEXT_PUBLIC_SUPABASE_URL: environment.url,
    WEB_ORIGIN: environment.webOrigin,
  }
}
