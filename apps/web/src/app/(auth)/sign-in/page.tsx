import Link from 'next/link'
import { AuthForm } from '../../../features/auth/AuthForm'
import { INITIAL_FORM_STATE } from '../../../features/auth/action-state'
import { signInAction } from '../../../features/auth/actions'
import styles from '../../auth-account.module.css'

interface SignInPageProps {
  searchParams: Promise<{ confirmed?: string; returnTo?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { confirmed, returnTo } = await searchParams

  return (
    <main className={styles.shell}>
      <section aria-labelledby="sign-in-heading" className={styles.panel}>
        <p className={styles.eyebrow}>ZIWEI AI</p>
        <h1 id="sign-in-heading">Dang nhap</h1>
        {confirmed === '1' ? <p role="status">Email cua ban da duoc xac nhan.</p> : null}
        <AuthForm action={signInAction} initialState={INITIAL_FORM_STATE}>
          <input name="returnTo" type="hidden" value={returnTo ?? ''} />
          <label htmlFor="sign-in-email">Email</label>
          <input autoComplete="email" id="sign-in-email" name="email" required type="email" />
          <label htmlFor="sign-in-password">Mat khau</label>
          <input autoComplete="current-password" id="sign-in-password" name="password" required type="password" />
        </AuthForm>
        <nav aria-label="Tai khoan">
          <Link href="/forgot-password">Quen mat khau?</Link>
          <Link href="/sign-up">Tao tai khoan</Link>
        </nav>
      </section>
    </main>
  )
}