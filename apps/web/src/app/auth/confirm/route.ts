import { NextResponse } from 'next/server'
import { completeAuthCallback } from '../../../features/auth/auth-callback'
import { getWebOrigin } from '../../../features/auth/web-origin'
import { createServerSupabaseClient } from '../../../lib/supabase/server'

export async function GET(request: Request): Promise<NextResponse> {
  const client = await createServerSupabaseClient()
  const result = await completeAuthCallback({
    client,
    expectedRedirectType: 'confirmation',
    requestUrl: request.url,
    successPath: '/sign-in?confirmed=1',
  })
  const path = result.kind === 'success' ? result.path : '/confirm-email?status=error'

  return NextResponse.redirect(new URL(path, getWebOrigin()))
}
