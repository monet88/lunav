import { parseAuthReturnDestination } from '@lunav/contracts'
import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { signInAction } from '../../../features/auth/actions'
import { withReturnTo } from '../../../features/auth/return-path'

interface SignInPageProps {
  searchParams: Promise<{ confirmed?: string; returnTo?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { confirmed, returnTo: rawReturnTo } = await searchParams
  const returnTo = parseAuthReturnDestination(rawReturnTo ?? '')

  return (
    <main className="auth-shell">
      <section aria-labelledby="sign-in-heading" className="auth-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="sign-in-heading">Dang nhap</h1>
        {confirmed === '1' ? <p role="status">Email cua ban da duoc xac nhan.</p> : null}
        <AuthForm action={signInAction} initialState={INITIAL_FORM_STATE}>
          <input name="returnTo" type="hidden" value={returnTo} />
          <label htmlFor="sign-in-email">Email</label>
          <input autoComplete="email" id="sign-in-email" name="email" required type="email" />
          <label htmlFor="sign-in-password">Mat khau</label>
          <input autoComplete="current-password" id="sign-in-password" name="password" required type="password" />
        </AuthForm>
        <nav aria-label="Tai khoan">
          <Link href={withReturnTo('/forgot-password', returnTo)}>Quen mat khau?</Link>
          <Link href={withReturnTo('/sign-up', returnTo)}>Tao tai khoan</Link>
        </nav>
      </section>
    </main>
  )
}