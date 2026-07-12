'use client'

import { useActionState } from 'react'
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
    <form action={formAction} className="account-form">
      <label htmlFor="displayName">Ten hien thi</label>
      <input
        autoComplete="nickname"
        // Server-provided initial value; successful updates are proven by
        // reloading the account page rather than forcing a controlled effect.
        defaultValue={displayName ?? ''}
        id="displayName"
        name="displayName"
        type="text"
      />
      <p
        aria-live="polite"
        className={state.kind === 'error' ? 'form-error' : 'form-status'}
      >
        {state.message}
      </p>
      <button disabled={pending} type="submit">
        {pending ? 'Dang luu...' : 'Luu thay doi'}
      </button>
    </form>
  )
}