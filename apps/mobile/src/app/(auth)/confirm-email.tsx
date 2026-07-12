import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { ConfirmEmailForm } from '@/features/auth/ConfirmEmailForm'
import { parseConfirmEmailSearchParams } from '@/features/auth/search-params'
import { resendSignupConfirmation } from '@/features/auth/sign-up'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

export default function ConfirmEmailRoute() {
  const params = useLocalSearchParams()
  const { initialError } = parseConfirmEmailSearchParams(params)

  return (
    <View style={styles.container} testID="confirm-email-screen">
      <SafeAreaView style={styles.safeArea}>
        <ConfirmEmailForm
          initialError={initialError}
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
