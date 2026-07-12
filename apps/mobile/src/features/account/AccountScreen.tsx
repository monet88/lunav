import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { AuthState, Profile } from '@lunav/contracts'
import { loadOwnerProfile, type ProfileReadClient } from './load-profile'
import { ProfileForm } from './ProfileForm'
import {
  GENERIC_SIGN_OUT_FAILURE_MESSAGE,
  UNAUTHORIZED_PROFILE_MESSAGE,
} from './profile-action-state'
import { signOutToPublic } from './sign-out'
import {
  updateProfileDisplayName,
  type ProfileSupabaseClient,
} from './update-profile'

/**
 * Combined read/write profiles client. Intersection is expressed as a single
 * `from` return type so select and update stay on one table builder shape.
 */
export type AccountScreenClient = {
  from: (table: 'profiles') => ReturnType<ProfileReadClient['from']> &
    ReturnType<ProfileSupabaseClient['from']>
}

interface AccountScreenProps {
  authState: AuthState
  client: AccountScreenClient
  onSignOut: () => Promise<void>
  onNavigatePublic: () => void
}

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'ready'; profile: Profile }
  | { kind: 'error'; message: string }
  | { kind: 'unauthorized'; message: string }

/**
 * Confirmed-auth account surface: read-only email/confirmation, owner-scoped
 * display_name edit, and ordered sign-out back to the public shell.
 */
export function AccountScreen({
  authState,
  client,
  onSignOut,
  onNavigatePublic,
}: AccountScreenProps) {
  const [screen, setScreen] = useState<ScreenState>({ kind: 'loading' })
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    if (authState.status !== 'authenticated') {
      setScreen({
        kind: 'unauthorized',
        message: UNAUTHORIZED_PROFILE_MESSAGE,
      })
      return () => {
        isActive = false
      }
    }

    setScreen({ kind: 'loading' })
    void loadOwnerProfile(client, authState).then((result) => {
      if (!isActive) {
        return
      }

      if (result.kind === 'loaded') {
        setScreen({ kind: 'ready', profile: result.profile })
        return
      }

      if (result.kind === 'unauthorized') {
        setScreen({ kind: 'unauthorized', message: result.message })
        return
      }

      setScreen({ kind: 'error', message: result.message })
    })

    return () => {
      isActive = false
    }
  }, [authState, client])

  const isAuthenticated = authState.status === 'authenticated'
  const email = isAuthenticated ? authState.identity.email : ''
  let confirmationLabel = ''
  if (isAuthenticated) {
    confirmationLabel = authState.identity.isEmailConfirmed
      ? 'Da xac nhan'
      : 'Chua xac nhan'
  }

  const handleSignOut = async () => {
    if (signingOut) {
      return
    }

    setSigningOut(true)
    setSignOutError(null)
    try {
      await signOutToPublic({
        signOut: onSignOut,
        replace: () => {
          onNavigatePublic()
        },
      })
    } catch {
      // Keep the loaded profile form mounted; only surface a sign-out failure.
      setSignOutError(GENERIC_SIGN_OUT_FAILURE_MESSAGE)
      setSigningOut(false)
    }
  }

  return (
    <View style={styles.container} testID="account-screen">
      <SafeAreaView style={styles.safeArea}>
        <Text accessibilityRole="header" style={styles.title}>
          Tai khoan
        </Text>

        {isAuthenticated ? (
          <View style={styles.details} testID="account-details">
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue} testID="account-email">
              {email}
            </Text>
            <Text style={styles.detailLabel}>Trang thai email</Text>
            <Text style={styles.detailValue} testID="account-confirmation">
              {confirmationLabel}
            </Text>
          </View>
        ) : null}

        {screen.kind === 'loading' ? (
          <ActivityIndicator color="#208AEF" testID="account-loading" />
        ) : null}

        {screen.kind === 'ready' ? (
          <ProfileForm
            displayName={screen.profile.displayName}
            onSubmit={(fields) =>
              updateProfileDisplayName(client, authState, fields)
            }
            onUpdated={(profile) => {
              setScreen({ kind: 'ready', profile })
            }}
          />
        ) : null}

        {screen.kind === 'error' || screen.kind === 'unauthorized' ? (
          <Text
            accessibilityLiveRegion="polite"
            style={styles.error}
            testID="account-status"
          >
            {screen.message}
          </Text>
        ) : null}

        {signOutError !== null ? (
          <Text
            accessibilityLiveRegion="polite"
            style={styles.error}
            testID="account-sign-out-status"
          >
            {signOutError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut, busy: signingOut }}
          disabled={signingOut}
          onPress={() => {
            void handleSignOut()
          }}
          style={[styles.signOutButton, signingOut ? styles.buttonDisabled : null]}
          testID="account-sign-out"
        >
          {signingOut ? (
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.signOutLabel}>Dang xuat</Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  details: {
    width: '100%',
    maxWidth: 420,
    gap: 4,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 16,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: '#fecaca',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 16,
    backgroundColor: '#fff1f2',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signOutLabel: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
})
