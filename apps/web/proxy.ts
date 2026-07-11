import { normalizeAuthState } from '@lunav/contracts'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getWebSupabaseConfig } from './src/lib/supabase/config'

function isConfirmedUser(user: User | null): boolean {
  if (user === null) {
    return false
  }

  try {
    return (
      normalizeAuthState({
        email: user.email,
        email_confirmed_at: user.email_confirmed_at ?? null,
        id: user.id,
      }).status === 'authenticated'
    )
  } catch {
    return false
  }
}

function redirectToSignIn(
  request: NextRequest,
  cookieResponse: NextResponse
): NextResponse {
  const signInUrl = new URL('/sign-in', request.url)
  signInUrl.searchParams.set('returnTo', '/account')
  const redirectResponse = NextResponse.redirect(signInUrl)
  const forwardedHeaderNames = new Set([
    'cache-control',
    'expires',
    'pragma',
  ])

  cookieResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  cookieResponse.headers.forEach((value, name) => {
    if (forwardedHeaderNames.has(name.toLowerCase())) {
      redirectResponse.headers.set(name, value)
    }
  })

  return redirectResponse
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next()

  try {
    const config = getWebSupabaseConfig()
    const supabase = createServerClient(config.url, config.publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, options, value }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
          response = NextResponse.next({
            request: {
              headers: new Headers(request.headers),
            },
          })
          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options)
          })
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value)
          })
        },
      },
    })
    const { data, error } = await supabase.auth.getUser()

    if (error || !isConfirmedUser(data.user)) {
      return redirectToSignIn(request, response)
    }

    return response
  } catch {
    return redirectToSignIn(request, response)
  }
}

export const config = {
  matcher: '/account/:path*',
}