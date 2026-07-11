import { cookies } from 'next/headers'

const RECOVERY_SESSION_COOKIE = 'lunav-recovery-session'

export async function hasRecoverySession(userId: string): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(RECOVERY_SESSION_COOKIE)?.value === userId
}

export function setRecoverySessionCookie(
  response: Response,
  userId: string
): void {
  const nextResponse = response as Response & {
    cookies?: {
      set: (name: string, value: string, options: Record<string, boolean | number | string>) => void
    }
  }

  nextResponse.cookies?.set(RECOVERY_SESSION_COOKIE, userId, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearRecoverySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(RECOVERY_SESSION_COOKIE)
}
