import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { recoveryLinkFailureMessage } from '@/features/auth/auth-result'

/**
 * Recovery deep-link failure surface. Registered outside Stack.Protected so a
 * cold-start missing/invalid/wrong-flow code can still show the error while the
 * public (auth) group remains gated during session boot.
 */
export default function AuthRecoveryFailedRoute() {
  return (
    <View style={styles.container} testID="recovery-failed-screen">
      <SafeAreaView style={styles.safeArea}>
        <Text accessibilityRole="header" style={styles.title}>
          Dat lai mat khau
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={styles.message}
          testID="recovery-failed-message"
        >
          {recoveryLinkFailureMessage()}
        </Text>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          <Text style={styles.linkText}>Thu gui lai huong dan</Text>
        </Link>
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
  link: {
    marginTop: 4,
  },
  linkText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
