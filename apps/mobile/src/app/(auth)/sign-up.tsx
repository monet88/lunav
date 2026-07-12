import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { SignUpForm } from '@/features/auth/SignUpForm'
import { signUpWithEmailPassword } from '@/features/auth/sign-up'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function SignUpRoute() {
  return (
    <View style={styles.container} testID="sign-up-screen">
      <SafeAreaView style={styles.safeArea}>
        <SignUpForm
          onSubmit={async (fields) =>
            signUpWithEmailPassword(getSharedMobileSupabaseClient(), fields)
          }
        />
        <Link href="/(auth)/confirm-email" style={styles.link}>
          <Text style={styles.linkText}>Can gui lai email xac nhan?</Text>
        </Link>
        <Link href="/(auth)" style={styles.link}>
          <Text style={styles.linkText}>Da co tai khoan? Quay lai</Text>
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
    textAlign: 'center',
  },
})
