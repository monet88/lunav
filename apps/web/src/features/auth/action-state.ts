export type FormActionState =
  | { kind: 'confirmation-pending'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'idle'; message: '' }
  | { kind: 'recovery-pending'; message: string }

export const INITIAL_FORM_STATE: FormActionState = { kind: 'idle', message: '' }