import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'
import { authScreenStyles } from '@/features/auth/auth-screen-styles'
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
    <View style={authScreenStyles.container} testID="reset-password-screen">
      <SafeAreaView style={authScreenStyles.safeArea}>
        <ResetPasswordForm
          onPasswordUpdated={() => {
            // Recovery already authenticated the session; public (auth) is closed.
            router.replace('/(protected)' as never)
          }}
          onSubmit={async (fields) =>
            resetPasswordWithRecoveryProof(
              getSharedMobileSupabaseClient(),
              fields
            )
          }
        />
        <Link href="/(protected)" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Ve man hinh chinh</Text>
        </Link>
      </SafeAreaView>
    </View>
  )
}
