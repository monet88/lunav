import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { SignInForm } from '@/features/auth/SignInForm'
import { canAccessPrivateShell } from '@/features/auth/auth-shell'
import { genericFailureState } from '@/features/auth/auth-result'
import { authScreenStyles } from '@/features/auth/auth-screen-styles'
import { signInWithEmailPassword } from '@/features/auth/sign-in'
import { parseSignInSearchParams } from '@/features/auth/search-params'
import { useMobileAuthSession } from '@/features/auth/session-provider'
import { waitForAuthState } from '@/features/auth/wait-for-auth-state'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function AuthIndexRoute() {
  const rawParams = useLocalSearchParams()
  const { returnTo } = parseSignInSearchParams(rawParams)
  const session = useMobileAuthSession()

  return (
    <View style={authScreenStyles.container} testID="public-auth-shell">
      <SafeAreaView style={authScreenStyles.safeArea}>
        <SignInForm
          onSubmit={async (fields) => {
            const result = await signInWithEmailPassword(
              getSharedMobileSupabaseClient(),
              fields,
              returnTo
            )

            if (result.kind !== 'signed-in') {
              return result
            }

            // Identity refresh already succeeded in signInWithEmailPassword.
            // Still wait for the session controller to publish authenticated so
            // Stack.Protected opens before replace — otherwise the user stays
            // on the public shell with a cleared form and no error.
            try {
              await waitForAuthState(session, canAccessPrivateShell)
              return result
            } catch {
              return genericFailureState()
            }
          }}
          onSignedIn={(href) => {
            // Replace so the sign-in form is not left under the private shell.
            router.replace(href)
          }}
        />
        <Link href="/(auth)/forgot-password" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Quen mat khau?</Text>
        </Link>
        <Link href="/(auth)/sign-up" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Tao tai khoan moi</Text>
        </Link>
      </SafeAreaView>
    </View>
  )
}
