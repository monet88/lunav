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
  confirmLinkFailureMessage,
  type AuthActionResult,
  type FormActionState,
  INITIAL_FORM_STATE,
} from './auth-result'

interface ConfirmEmailFormProps {
  initialError?: boolean
  onResend: (email: string) => Promise<AuthActionResult>
}

export function ConfirmEmailForm({
  initialError = false,
  onResend,
}: ConfirmEmailFormProps) {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<FormActionState>(INITIAL_FORM_STATE)
  // Ref guards against double-submit before the pending re-render lands.
  const inFlightRef = useRef(false)

  const handleResend = async () => {
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    setPending(true)
    try {
      const next = await onResend(email)
      setState(next)
    } finally {
      inFlightRef.current = false
      setPending(false)
    }
  }

  const statusIsError = state.kind === 'error'
  const introMessage = initialError
    ? confirmLinkFailureMessage()
    : 'Kiem tra hop thu de xac nhan tai khoan cua ban.'

  return (
    <View style={styles.form} testID="confirm-email-form">
      <Text accessibilityRole="header" style={styles.title}>
        Xac nhan email
      </Text>
      <Text
        accessibilityLiveRegion="polite"
        style={styles.intro}
        testID="confirm-email-intro"
      >
        {introMessage}
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
        testID="resend-email"
        textContentType="emailAddress"
        value={email}
      />

      {state.message.length > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          style={statusIsError ? styles.error : styles.status}
          testID="confirm-email-status"
        >
          {state.message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending, busy: pending }}
        disabled={pending}
        onPress={() => {
          void handleResend()
        }}
        style={[styles.button, pending ? styles.buttonDisabled : null]}
        testID="resend-submit"
      >
        {pending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonLabel}>Gui lai email xac nhan</Text>
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
  intro: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 8,
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
