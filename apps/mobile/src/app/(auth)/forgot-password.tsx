import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams } from 'expo-router'
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm'
import { requestPasswordRecovery } from '@/features/auth/forgot-password'
import { parseForgotPasswordSearchParams } from '@/features/auth/search-params'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function ForgotPasswordRoute() {
  const rawParams = useLocalSearchParams()
  const { initialError } = parseForgotPasswordSearchParams(rawParams)

  return (
    <View style={styles.container} testID="forgot-password-screen">
      <SafeAreaView style={styles.safeArea}>
        <ForgotPasswordForm
          initialError={initialError}
          onSubmit={async (fields) =>
            requestPasswordRecovery(getSharedMobileSupabaseClient(), fields)
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
