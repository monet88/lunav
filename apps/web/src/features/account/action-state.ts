export type ProfileActionState =
  | { kind: 'error'; message: string }
  | { kind: 'idle'; message: '' }
  | { kind: 'success'; message: string }

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  kind: 'idle',
  message: '',
}