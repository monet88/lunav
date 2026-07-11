import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { resendConfirmationAction } from '../../../features/auth/actions'

interface ConfirmEmailPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const { status } = await searchParams

  return (
    <main className="auth-shell">
      <section aria-labelledby="confirm-email-heading" className="auth-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="confirm-email-heading">Xac nhan email</h1>
        <p role="status">
          {status === 'error'
            ? 'Lien ket xac nhan khong hop le hoac da het han.'
            : 'Kiem tra hop thu de xac nhan tai khoan cua ban.'}
        </p>
        <AuthForm action={resendConfirmationAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="resend-email">Email</label>
          <input autoComplete="email" id="resend-email" name="email" required type="email" />
        </AuthForm>
      </section>
    </main>
  )
}