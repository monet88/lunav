import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TEXT_FILE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.env',
  '.example',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
])
const IGNORED_DIRECTORIES = new Set([
  '.expo',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
])
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/
const FORBIDDEN_CLIENT_SECRETS = [
  ['serviceRoleKey', /\bserviceRoleKey\s*(?:=|:)/i],
  ['SUPABASE_SERVICE_ROLE_KEY', /SUPABASE_SERVICE_ROLE_KEY/i],
  ['SUPABASE_SECRET_KEY', /SUPABASE_SECRET_KEY/i],
  ['OPENAI_API_KEY', /OPENAI_API_KEY/i],
  ['ANTHROPIC_API_KEY', /ANTHROPIC_API_KEY/i],
  ['STRIPE_SECRET_KEY', /STRIPE_SECRET_KEY/i],
  ['RESEND_API_KEY', /RESEND_API_KEY/i],
  ['AWS_SECRET_ACCESS_KEY', /AWS_SECRET_ACCESS_KEY/i],
]

export function findForbiddenClientSecrets(source) {
  return FORBIDDEN_CLIENT_SECRETS.flatMap(([name, pattern]) =>
    pattern.test(source) ? [name] : []
  )
}

function collectTextFiles(directory) {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return IGNORED_DIRECTORIES.has(entry.name)
        ? []
        : collectTextFiles(entryPath)
    }

    return TEXT_FILE_EXTENSIONS.has(extname(entry.name)) &&
      !TEST_FILE_PATTERN.test(entry.name)
      ? [entryPath]
      : []
  })
}

function collectEnvironmentExamples(directory) {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return IGNORED_DIRECTORIES.has(entry.name)
        ? []
        : collectEnvironmentExamples(entryPath)
    }

    return entry.name === '.env.example' ? [entryPath] : []
  })
}

export function scanClientFiles(rootDirectory) {
  const files = [
    ...collectTextFiles(join(rootDirectory, 'apps')),
    ...collectTextFiles(join(rootDirectory, 'packages')),
    ...collectEnvironmentExamples(rootDirectory),
  ]

  return files.flatMap((filePath) => {
    const matches = findForbiddenClientSecrets(readFileSync(filePath, 'utf8'))

    return matches.length === 0
      ? []
      : [{ path: relative(rootDirectory, filePath).split(sep).join('/'), matches }]
  })
}

function run() {
  const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const findings = scanClientFiles(rootDirectory)

  if (findings.length === 0) {
    return
  }

  for (const finding of findings) {
    console.error(
      `[client-secret] ${finding.path}: ${finding.matches.join(', ')}`
    )
  }

  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
}