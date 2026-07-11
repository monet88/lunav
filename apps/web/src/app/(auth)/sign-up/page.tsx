import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { signUpAction } from '../../../features/auth/actions'
import styles from '../../auth-account.module.css'

export default function SignUpPage() {
  return (
    <main className={styles.shell}>
      <section aria-labelledby="sign-up-heading" className={styles.panel}>
        <p className={styles.eyebrow}>ZIWEI AI</p>
        <h1 id="sign-up-heading">Tao tai khoan</h1>
        <AuthForm action={signUpAction} initialState={INITIAL_FORM_STATE}>
          <label htmlFor="sign-up-email">Email</label>
          <input autoComplete="email" id="sign-up-email" name="email" required type="email" />
          <label htmlFor="sign-up-password">Mat khau</label>
          <input autoComplete="new-password" id="sign-up-password" name="password" required type="password" />
          <label htmlFor="sign-up-password-confirmation">Nhap lai mat khau</label>
          <input autoComplete="new-password" id="sign-up-password-confirmation" name="passwordConfirmation" required type="password" />
        </AuthForm>
        <Link href="/sign-in">Da co tai khoan? Dang nhap</Link>
      </section>
    </main>
  )
}