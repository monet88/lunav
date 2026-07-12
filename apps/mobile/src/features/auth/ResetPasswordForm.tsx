import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  genericFailureState,
  INITIAL_FORM_STATE,
  type FormActionState,
} from './auth-result'
import type { ResetPasswordResult } from './reset-password'

interface ResetPasswordFormProps {
  onSubmit: (fields: {
    password: string
    passwordConfirmation: string
  }) => Promise<ResetPasswordResult>
  onPasswordUpdated?: (message: string) => void
}

export function ResetPasswordForm({
  onSubmit,
  onPasswordUpdated,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<FormActionState>(INITIAL_FORM_STATE)
  // Ref guards against double-submit before the pending re-render lands.
  const inFlightRef = useRef(false)

  const handleSubmit = async () => {
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    setPending(true)
    try {
      const next = await onSubmit({ password, passwordConfirmation })
      if (next.kind === 'password-updated') {
        setState({ kind: 'confirmation-pending', message: next.message })
        onPasswordUpdated?.(next.message)
        return
      }

      setState(next)
    } catch {
      setState(genericFailureState())
    } finally {
      inFlightRef.current = false
      setPending(false)
    }
  }

  const statusIsError = state.kind === 'error'

  return (
    <View style={styles.form} testID="reset-password-form">
      <Text accessibilityRole="header" style={styles.title}>
        Tao mat khau moi
      </Text>

      <Text style={styles.label}>Mat khau moi</Text>
      <TextInput
        accessibilityLabel="Mat khau moi"
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!pending}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        testID="reset-password"
        textContentType="newPassword"
        value={password}
      />

      <Text style={styles.label}>Nhap lai mat khau moi</Text>
      <TextInput
        accessibilityLabel="Nhap lai mat khau moi"
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!pending}
        onChangeText={setPasswordConfirmation}
        secureTextEntry
        style={styles.input}
        testID="reset-password-confirmation"
        textContentType="newPassword"
        value={passwordConfirmation}
      />

      {state.message.length > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          style={statusIsError ? styles.error : styles.status}
          testID="reset-password-status"
        >
          {state.message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending, busy: pending }}
        disabled={pending}
        onPress={() => {
          void handleSubmit()
        }}
        style={[styles.button, pending ? styles.buttonDisabled : null]}
        testID="reset-password-submit"
      >
        {pending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>Cap nhat mat khau</Text>
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
  title: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
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
