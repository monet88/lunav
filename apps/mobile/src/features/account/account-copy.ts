/**
 * Account surface copy boundary for MVP `vi`.
 * Stable keys are the identifiers; display strings live only in the locale map
 * so a later `en` catalog does not require hunting UI literals.
 */
export type AccountCopyKey =
  | 'account.title'
  | 'account.emailLabel'
  | 'account.confirmationLabel'
  | 'account.confirmation.confirmed'
  | 'account.confirmation.unconfirmed'
  | 'account.displayNameLabel'
  | 'account.save'
  | 'account.signOut'
  | 'account.error.unauthorized'
  | 'account.error.invalidForm'
  | 'account.error.updateFailed'
  | 'account.error.loadFailed'
  | 'account.error.signOutFailed'
  | 'account.success.updated'

export type AccountLocale = 'vi'

const VI_COPY: Record<AccountCopyKey, string> = {
  'account.title': 'Tai khoan',
  'account.emailLabel': 'Email',
  'account.confirmationLabel': 'Trang thai email',
  'account.confirmation.confirmed': 'Da xac nhan',
  'account.confirmation.unconfirmed': 'Chua xac nhan',
  'account.displayNameLabel': 'Ten hien thi',
  'account.save': 'Luu thay doi',
  'account.signOut': 'Dang xuat',
  'account.error.unauthorized': 'Vui long dang nhap lai de tiep tuc.',
  'account.error.invalidForm': 'Vui long kiem tra lai thong tin da nhap.',
  'account.error.updateFailed': 'Khong the cap nhat thong tin. Vui long thu lai.',
  'account.error.loadFailed':
    'Khong the tai thong tin tai khoan. Vui long thu lai.',
  'account.error.signOutFailed': 'Khong the dang xuat. Vui long thu lai.',
  'account.success.updated': 'Thong tin da duoc cap nhat.',
}

/**
 * Resolve an account copy key for the active locale. MVP only enables `vi`.
 */
export function accountCopy(
  key: AccountCopyKey,
  locale: AccountLocale = 'vi'
): string {
  void locale
  return VI_COPY[key]
}
