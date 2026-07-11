import { parseAuthReturnDestination } from '@lunav/contracts'
import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { forgotPasswordAction } from '../../../features/auth/actions'
import { withReturnTo } from '../../../features/auth/return-path'

interface ForgotPasswordPageProps {
  searchParams: Promise<{ returnTo?: string; status?: string }>
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { returnTo: rawReturnTo, status } = await searchParams
  const returnTo = parseAuthReturnDestination(rawReturnTo ?? '')

  return (
    <main className="auth-shell">
      <section aria-labelledby="forgot-password-heading" className="auth-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="forgot-password-heading">Dat lai mat khau</h1>
        {status === 'error' ? (
          <p role="status">Lien ket dat lai mat khau khong hop le hoac da het han.</p>
        ) : null}
        <AuthForm action={forgotPasswordAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="forgot-password-email">Email</label>
          <input autoComplete="email" id="forgot-password-email" name="email" required type="email" />
        </AuthForm>
        <Link href={withReturnTo('/sign-in', returnTo)}>Quay lai dang nhap</Link>
      </section>
    </main>
  )
}