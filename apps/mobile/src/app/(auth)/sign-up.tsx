import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { authScreenStyles } from '@/features/auth/auth-screen-styles'
import { SignUpForm } from '@/features/auth/SignUpForm'
import { signUpWithEmailPassword } from '@/features/auth/sign-up'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function SignUpRoute() {
  return (
    <View style={authScreenStyles.container} testID="sign-up-screen">
      <SafeAreaView style={authScreenStyles.safeArea}>
        <SignUpForm
          onSubmit={async (fields) =>
            signUpWithEmailPassword(getSharedMobileSupabaseClient(), fields)
          }
        />
        <Link href="/(auth)/confirm-email" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Can gui lai email xac nhan?</Text>
        </Link>
        <Link href="/(auth)" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Da co tai khoan? Quay lai</Text>
        </Link>
      </SafeAreaView>
    </View>
  )
}
