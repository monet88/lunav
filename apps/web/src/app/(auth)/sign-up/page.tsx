import { parseAuthReturnDestination } from '@lunav/contracts'
import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { signUpAction } from '../../../features/auth/actions'

interface SignUpPageProps {
  searchParams: Promise<{ returnTo?: string }>
}

function withReturnTo(path: string, returnTo: string): string {
  if (returnTo.length === 0 || returnTo === '/') {
    return path
  }

  const url = new URL(path, 'http://localhost')
  url.searchParams.set('returnTo', returnTo)
  return `${url.pathname}${url.search}`
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { returnTo: rawReturnTo } = await searchParams
  const returnTo = parseAuthReturnDestination(rawReturnTo ?? '')

  return (
    <main className="auth-shell">
      <section aria-labelledby="sign-up-heading" className="auth-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="sign-up-heading">Tao tai khoan</h1>
        <AuthForm action={signUpAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="sign-up-email">Email</label>
          <input autoComplete="email" id="sign-up-email" name="email" required type="email" />
          <label htmlFor="sign-up-password">Mat khau</label>
          <input autoComplete="new-password" id="sign-up-password" name="password" required type="password" />
          <label htmlFor="sign-up-password-confirmation">Nhap lai mat khau</label>
          <input autoComplete="new-password" id="sign-up-password-confirmation" name="passwordConfirmation" required type="password" />
        </AuthForm>
        <Link href={withReturnTo('/sign-in', returnTo)}>Da co tai khoan? Dang nhap</Link>
      </section>
    </main>
  )
}