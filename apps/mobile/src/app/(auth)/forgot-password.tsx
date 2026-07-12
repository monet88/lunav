import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams } from 'expo-router'
import { authScreenStyles } from '@/features/auth/auth-screen-styles'
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm'
import { requestPasswordRecovery } from '@/features/auth/forgot-password'
import { parseForgotPasswordSearchParams } from '@/features/auth/search-params'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function ForgotPasswordRoute() {
  const rawParams = useLocalSearchParams()
  const { initialError } = parseForgotPasswordSearchParams(rawParams)

  return (
    <View style={authScreenStyles.container} testID="forgot-password-screen">
      <SafeAreaView style={authScreenStyles.safeArea}>
        <ForgotPasswordForm
          initialError={initialError}
          onSubmit={async (fields) =>
            requestPasswordRecovery(getSharedMobileSupabaseClient(), fields)
          }
        />
        <Link href="/(auth)" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Quay lai dang nhap</Text>
        </Link>
      </SafeAreaView>
    </View>
  )
}
