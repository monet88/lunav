'use client'

import { useActionState } from 'react'
import type { FormActionState } from './action-state'

interface AuthFormProps {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>
  children: React.ReactNode
  initialState: FormActionState
}

export function AuthForm({ action, children, initialState }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="auth-form" noValidate>
      {children}
      <p
        aria-live="polite"
        className={state.kind === 'error' ? 'form-error' : 'form-status'}
      >
        {state.message}
      </p>
      <button disabled={pending} type="submit">
        {pending ? 'Dang xu ly...' : 'Tiep tuc'}
      </button>
    </form>
  )
}