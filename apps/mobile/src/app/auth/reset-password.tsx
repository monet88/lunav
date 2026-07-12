import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm'
import { resetPasswordWithRecoveryProof } from '@/features/auth/reset-password'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Reset-password after a valid recovery exchange. Registered outside
 * Stack.Protected because recovery leaves an authenticated session, which would
 * otherwise close the public (auth) group before the user can set a new password.
 */
export default function AuthResetPasswordRoute() {
  return (
    <View style={styles.container} testID="reset-password-screen">
      <SafeAreaView style={styles.safeArea}>
        <ResetPasswordForm
          onSubmit={async (fields) =>
            resetPasswordWithRecoveryProof(
              getSharedMobileSupabaseClient(),
              fields
            )
          }
        />
        <Link href="/(auth)" style={styles.link}>
          <Text style={styles.linkText}>Quay lai dang nhap</Text>
        </Link>
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
  link: {
    marginTop: 8,
  },
  linkText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
