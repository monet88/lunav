import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { FormActionState } from './auth-result'
import { INITIAL_FORM_STATE } from './auth-result'
import type { SignInResult } from './sign-in'

interface SignInFormProps {
  onSubmit: (fields: {
    email: string
    password: string
  }) => Promise<SignInResult>
  onSignedIn: (href: Extract<SignInResult, { kind: 'signed-in' }>['href']) => void
}

export function SignInForm({ onSubmit, onSignedIn }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      const next = await onSubmit({ email, password })
      if (next.kind === 'signed-in') {
        setState(INITIAL_FORM_STATE)
        onSignedIn(next.href)
        return
      }

      setState(next)
    } finally {
      inFlightRef.current = false
      setPending(false)
    }
  }

  const statusIsError = state.kind === 'error'

  return (
    <View style={styles.form} testID="sign-in-form">
      <Text accessibilityRole="header" style={styles.title}>
        Dang nhap
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
        testID="sign-in-email"
        textContentType="emailAddress"
        value={email}
      />

      <Text style={styles.label}>Mat khau</Text>
      <TextInput
        accessibilityLabel="Mat khau"
        autoCapitalize="none"
        autoComplete="password"
        editable={!pending}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        testID="sign-in-password"
        textContentType="password"
        value={password}
      />

      {state.message.length > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          style={statusIsError ? styles.error : styles.status}
          testID="sign-in-status"
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
        testID="sign-in-submit"
      >
        {pending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>Dang nhap</Text>
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
