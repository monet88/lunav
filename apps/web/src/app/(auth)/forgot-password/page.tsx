import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { forgotPasswordAction } from '../../../features/auth/actions'
import styles from '../../auth-account.module.css'

export default function ForgotPasswordPage() {
  return (
    <main className={styles.shell}>
      <section aria-labelledby="forgot-password-heading" className={styles.panel}>
        <p className={styles.eyebrow}>ZIWEI AI</p>
        <h1 id="forgot-password-heading">Dat lai mat khau</h1>
        <AuthForm action={forgotPasswordAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="forgot-password-email">Email</label>
          <input autoComplete="email" id="forgot-password-email" name="email" required type="email" />
        </AuthForm>
        <Link href="/sign-in">Quay lai dang nhap</Link>
      </section>
    </main>
  )
}