import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { Profile } from '@lunav/contracts'
import { accountCopy } from './account-copy'
import {
  genericProfileUpdateFailureState,
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from './profile-action-state'

interface ProfileFormProps {
  displayName: string | null
  disabled?: boolean
  onPendingChange?: (pending: boolean) => void
  onSubmit: (fields: { displayName: string }) => Promise<ProfileActionState>
  onUpdated?: (profile: Profile) => void
}

export function ProfileForm({
  displayName,
  disabled = false,
  onPendingChange,
  onSubmit,
  onUpdated,
}: ProfileFormProps) {
  const [value, setValue] = useState(displayName ?? '')
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<ProfileActionState>(
    INITIAL_PROFILE_ACTION_STATE
  )
  // Ref guards against double-submit before the pending re-render lands.
  const inFlightRef = useRef(false)

  const handleSubmit = async () => {
    if (disabled || inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    onPendingChange?.(true)
    setPending(true)
    try {
      const next = await onSubmit({ displayName: value })
      setState(next)
      if (next.kind === 'success') {
        setValue(next.profile.displayName ?? '')
        onUpdated?.(next.profile)
      }
    } catch {
      setState(genericProfileUpdateFailureState())
    } finally {
      inFlightRef.current = false
      onPendingChange?.(false)
      setPending(false)
    }
  }

  const statusIsError = state.kind === 'error'
  const displayNameLabel = accountCopy('account.displayNameLabel')
  const formBlocked = disabled || pending

  return (
    <View style={styles.form} testID="profile-form">
      <Text style={styles.label}>{displayNameLabel}</Text>
      <TextInput
        accessibilityLabel={displayNameLabel}
        autoCapitalize="words"
        autoComplete="nickname"
        editable={!formBlocked}
        onChangeText={setValue}
        style={styles.input}
        testID="profile-display-name"
        textContentType="nickname"
        value={value}
      />

      {state.message.length > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          style={statusIsError ? styles.error : styles.status}
          testID="profile-status"
        >
          {state.message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: formBlocked, busy: pending }}
        disabled={formBlocked}
        onPress={() => {
          void handleSubmit()
        }}
        style={[styles.button, formBlocked ? styles.buttonDisabled : null]}
        testID="profile-submit"
      >
        {pending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>{accountCopy('account.save')}</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    maxWidth: 420,
    gap: 8,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  status: {
    color: '#0f766e',
    fontSize: 14,
    marginTop: 8,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#208AEF',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
