import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { recoveryLinkFailureMessage } from '@/features/auth/auth-result'
import { authScreenStyles } from '@/features/auth/auth-screen-styles'

/**
 * Recovery deep-link failure surface. Registered outside Stack.Protected so a
 * cold-start missing/invalid/wrong-flow code can still show the error while the
 * public (auth) group remains gated during session boot.
 */
export default function AuthRecoveryFailedRoute() {
  return (
    <View style={authScreenStyles.container} testID="recovery-failed-screen">
      <SafeAreaView style={authScreenStyles.safeArea}>
        <Text accessibilityRole="header" style={styles.title}>
          Dat lai mat khau
        </Text>
        <Text style={styles.message} testID="recovery-failed-message">
          {recoveryLinkFailureMessage()}
        </Text>
        <Link href="/(auth)/forgot-password" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Thu gui lai huong dan</Text>
        </Link>
        <Link href="/(auth)" style={authScreenStyles.link}>
          <Text style={authScreenStyles.linkText}>Quay lai dang nhap</Text>
        </Link>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
  },
})
