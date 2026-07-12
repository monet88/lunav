import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  readLocalSupabaseEnvironment,
  toWebProcessEnvironment,
} from './helpers/local-env'

export default async function globalSetup(): Promise<void> {
  const environment = readLocalSupabaseEnvironment()
  const webEnv = toWebProcessEnvironment(environment)
  const envFile = resolve(__dirname, '../.env.local')
  const contents = Object.entries(webEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  writeFileSync(envFile, `${contents}\n`, 'utf8')
}
