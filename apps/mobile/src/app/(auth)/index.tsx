import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { SignInForm } from '@/features/auth/SignInForm'
import { signInWithEmailPassword } from '@/features/auth/sign-in'
import { parseSignInSearchParams } from '@/features/auth/search-params'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function AuthIndexRoute() {
  const rawParams = useLocalSearchParams()
  const { returnTo } = parseSignInSearchParams(rawParams)

  return (
    <View style={styles.container} testID="public-auth-shell">
      <SafeAreaView style={styles.safeArea}>
        <SignInForm
          onSubmit={async (fields) =>
            signInWithEmailPassword(
              getSharedMobileSupabaseClient(),
              fields,
              returnTo
            )
          }
          onSignedIn={(href) => {
            // Replace so the sign-in form is not left under the private shell.
            router.replace(href)
          }}
        />
        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={styles.linkText}>Tao tai khoan moi</Text>
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
