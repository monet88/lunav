import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { AuthActionResult, FormActionState } from './auth-result'
import { INITIAL_FORM_STATE } from './auth-result'

interface SignUpFormProps {
  onSubmit: (fields: {
    email: string
    password: string
    passwordConfirmation: string
  }) => Promise<AuthActionResult>
}

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [email, setEmail] = useState('')
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
      const next = await onSubmit({
        email,
        password,
        passwordConfirmation,
      })
      setState(next)
    } finally {
      inFlightRef.current = false
      setPending(false)
    }
  }

  const statusIsError = state.kind === 'error'

  return (
    <View style={styles.form} testID="sign-up-form">
      <Text accessibilityRole="header" style={styles.title}>
        Tao tai khoan
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        accessibilityLabel="Email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!pending}
        keyboardType="email-address"
        onChangeText={setEmail}
        style={styles.input}
        testID="sign-up-email"
        textContentType="emailAddress"
        value={email}
      />

      <Text style={styles.label}>Mat khau</Text>
      <TextInput
        accessibilityLabel="Mat khau"
        autoCapitalize="none"
        autoComplete="password-new"
        editable={!pending}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        testID="sign-up-password"
        textContentType="newPassword"
        value={password}
      />

      <Text style={styles.label}>Nhap lai mat khau</Text>
      <TextInput
        accessibilityLabel="Nhap lai mat khau"
        autoCapitalize="none"
        autoComplete="password-new"
        editable={!pending}
        onChangeText={setPasswordConfirmation}
        secureTextEntry
        style={styles.input}
        testID="sign-up-password-confirmation"
        textContentType="newPassword"
        value={passwordConfirmation}
      />

      {state.message.length > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          style={statusIsError ? styles.error : styles.status}
          testID="sign-up-status"
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
        testID="sign-up-submit"
      >
        {pending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>Tiep tuc</Text>
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
