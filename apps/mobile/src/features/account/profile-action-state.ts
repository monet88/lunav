import type { Profile } from '@lunav/contracts'

export type ProfileActionState =
  | { kind: 'error'; message: string }
  | { kind: 'idle'; message: '' }
  | { kind: 'success'; message: string; profile: Profile }

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  kind: 'idle',
  message: '',
}

// Keep message strings identical to web account actions so both surfaces share
// the same owner-facing copy for unauthorized / invalid / update outcomes.
export const UNAUTHORIZED_PROFILE_MESSAGE =
  'Vui long dang nhap lai de tiep tuc.'
export const INVALID_PROFILE_FORM_MESSAGE =
  'Vui long kiem tra lai thong tin da nhap.'
export const GENERIC_PROFILE_UPDATE_MESSAGE =
  'Khong the cap nhat thong tin. Vui long thu lai.'
export const PROFILE_UPDATE_SUCCESS_MESSAGE = 'Thong tin da duoc cap nhat.'
export const GENERIC_PROFILE_LOAD_MESSAGE =
  'Khong the tai thong tin tai khoan. Vui long thu lai.'
export const GENERIC_SIGN_OUT_FAILURE_MESSAGE =
  'Khong the dang xuat. Vui long thu lai.'
