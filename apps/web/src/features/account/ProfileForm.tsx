'use client'

import { useActionState } from 'react'
import styles from '../../app/auth-account.module.css'
import { INITIAL_PROFILE_ACTION_STATE } from './action-state'
import { updateProfileAction } from './actions'

interface ProfileFormProps {
  displayName: string | null
}

export function ProfileForm({ displayName }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    INITIAL_PROFILE_ACTION_STATE
  )

  return (
    <form action={formAction} className={styles.form}>
      <label htmlFor="displayName">Ten hien thi</label>
      <input
        autoComplete="nickname"
        defaultValue={displayName ?? ''}
        id="displayName"
        name="displayName"
        type="text"
      />
      <p aria-live="polite" className={state.kind === 'error' ? styles.error : styles.status}>
        {state.message}
      </p>
      <button disabled={pending} type="submit">
        {pending ? 'Dang luu...' : 'Luu thay doi'}
      </button>
    </form>
  )
}