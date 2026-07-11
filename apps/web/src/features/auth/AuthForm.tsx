'use client'

import { useActionState } from 'react'
import styles from '../../app/auth-account.module.css'
import type { FormActionState } from './action-state'

interface AuthFormProps {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>
  children: React.ReactNode
  initialState: FormActionState
}

export function AuthForm({ action, children, initialState }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className={styles.form} noValidate>
      {children}
      <p aria-live="polite" className={state.kind === 'error' ? styles.error : styles.status}>
        {state.message}
      </p>
      <button disabled={pending} type="submit">
        {pending ? 'Dang xu ly...' : 'Tiep tuc'}
      </button>
    </form>
  )
}