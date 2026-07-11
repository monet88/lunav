import { NextResponse } from 'next/server'
import { completeAuthCallback } from '../../../features/auth/auth-callback'
import { setRecoverySessionCookie } from '../../../features/auth/recovery-session'
import { getWebOrigin } from '../../../features/auth/web-origin'
import { createServerSupabaseClient } from '../../../lib/supabase/server'

export async function GET(request: Request): Promise<NextResponse> {
  const client = await createServerSupabaseClient()
  const result = await completeAuthCallback({
    client,
    expectedRedirectType: 'recovery',
    requestUrl: request.url,
    successPath: '/reset-password',
  })
  const path = result.kind === 'success' ? result.path : '/forgot-password?status=error'

  const response = NextResponse.redirect(new URL(path, getWebOrigin()))

  if (result.kind === 'success') {
    setRecoverySessionCookie(response, result.userId)
  }

  return response
}
