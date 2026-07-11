import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { resetPasswordAction } from '../../../features/auth/actions'

export default function ResetPasswordPage() {
  return (
    <main className="auth-shell">
      <section aria-labelledby="reset-password-heading" className="auth-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="reset-password-heading">Tao mat khau moi</h1>
        <AuthForm action={resetPasswordAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="reset-password">Mat khau moi</label>
          <input autoComplete="new-password" id="reset-password" name="password" required type="password" />
          <label htmlFor="reset-password-confirmation">Nhap lai mat khau moi</label>
          <input autoComplete="new-password" id="reset-password-confirmation" name="passwordConfirmation" required type="password" />
        </AuthForm>
      </section>
    </main>
  )
}