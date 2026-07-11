import { parseProfile } from '@lunav/contracts'
import { redirect } from 'next/navigation'
import { ProfileForm } from '../../../features/account/ProfileForm'
import { signOutAction } from '../../../features/account/actions'
import { createServerSupabaseClient, resolveCurrentAuthState } from '../../../lib/supabase/server'
import styles from '../../auth-account.module.css'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const client = await createServerSupabaseClient()
  const authState = await resolveCurrentAuthState(client)

  if (authState.status !== 'authenticated') {
    redirect('/sign-in?returnTo=/account')
  }

  const { data, error } = await client
    .from('profiles')
    .select()
    .eq('id', authState.identity.userId)
    .single()

  if (error || data === null) {
    redirect('/sign-in')
  }

  const profile = parseProfile(data)

  return (
    <main className={styles.shell}>
      <section aria-labelledby="account-heading" className={styles.panel}>
        <p className={styles.eyebrow}>ZIWEI AI</p>
        <h1 id="account-heading">Tai khoan</h1>
        <dl className={styles.details}>
          <div>
            <dt>Email</dt>
            <dd>{authState.identity.email}</dd>
          </div>
          <div>
            <dt>Trang thai email</dt>
            <dd>Da xac nhan</dd>
          </div>
        </dl>
        <ProfileForm displayName={profile.displayName} />
        <form action={signOutAction} className={styles.signOut}>
          <button type="submit">Dang xuat</button>
        </form>
      </section>
    </main>
  )
}