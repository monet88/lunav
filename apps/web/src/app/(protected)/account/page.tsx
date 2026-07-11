import { parseProfile } from '@lunav/contracts'
import { redirect } from 'next/navigation'
import { ProfileForm } from '../../../features/account/ProfileForm'
import { signOutAction } from '../../../features/account/actions'
import { createServerSupabaseClient, resolveCurrentAuthState } from '../../../lib/supabase/server'

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

  let profile
  try {
    profile = parseProfile(data)
  } catch {
    redirect('/sign-in')
  }

  return (
    <main className="account-shell">
      <section aria-labelledby="account-heading" className="account-panel">
        <p className="eyebrow">ZIWEI AI</p>
        <h1 id="account-heading">Tai khoan</h1>
        <dl className="account-details">
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
        <form action={signOutAction} className="sign-out-form">
          <button type="submit">Dang xuat</button>
        </form>
      </section>
    </main>
  )
}