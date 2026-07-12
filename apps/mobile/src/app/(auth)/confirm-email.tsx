import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { ConfirmEmailForm } from '@/features/auth/ConfirmEmailForm'
import { resendSignupConfirmation } from '@/features/auth/sign-up'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

function readStatusParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }
  return null
}

export default function ConfirmEmailRoute() {
  const params = useLocalSearchParams<{ status?: string | string[] }>()
  const status = readStatusParam(params.status)
  const initialError = status === 'error'

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
