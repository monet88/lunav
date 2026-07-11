const DEFAULT_WEB_ORIGIN = 'http://127.0.0.1:3000'

interface WebOriginEnvironment {
  NODE_ENV?: string
  WEB_ORIGIN?: string
}

function readNodeEnv(environment?: WebOriginEnvironment): string {
  return environment?.NODE_ENV ?? process.env.NODE_ENV ?? 'development'
}

function isAllowedHttpHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost'
}

export function getWebOrigin(
  environment?: WebOriginEnvironment
): string {
  const nodeEnv = readNodeEnv(environment)
  const configuredOrigin = environment?.WEB_ORIGIN ?? process.env.WEB_ORIGIN

  if (!configuredOrigin || configuredOrigin.trim().length === 0) {
    if (nodeEnv === 'production') {
      throw new Error('WEB_ORIGIN must be configured in production')
    }

    return DEFAULT_WEB_ORIGIN
  }

  try {
    const url = new URL(configuredOrigin)

    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('WEB_ORIGIN must be an origin only')
    }

    if (nodeEnv === 'production') {
      if (url.protocol !== 'https:') {
        throw new Error('WEB_ORIGIN must use HTTPS in production')
      }
    } else if (url.protocol === 'http:') {
      if (!isAllowedHttpHost(url.hostname)) {
        throw new Error('WEB_ORIGIN HTTP hosts are limited to localhost')
      }
    } else if (url.protocol !== 'https:') {
      throw new Error('WEB_ORIGIN must use HTTP or HTTPS')
    }

    return url.origin
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('WEB_ORIGIN')) {
      throw error
    }

    throw new Error('WEB_ORIGIN is invalid')
  }
}
