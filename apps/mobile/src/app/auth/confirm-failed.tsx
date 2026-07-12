import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ConfirmEmailForm } from '@/features/auth/ConfirmEmailForm'
import { resendSignupConfirmation } from '@/features/auth/sign-up'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Confirm deep-link failure surface. Registered outside Stack.Protected so a
 * cold-start missing/invalid code can still show the error + resend path while
 * the public (auth) group remains gated during session boot.
 */
export default function AuthConfirmFailedRoute() {
  return (
    <View style={styles.container} testID="confirm-failed-screen">
      <SafeAreaView style={styles.safeArea}>
        <ConfirmEmailForm
          initialError
          onResend={async (email) =>
            resendSignupConfirmation(getSharedMobileSupabaseClient(), email)
          }
        />
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
  },
})
