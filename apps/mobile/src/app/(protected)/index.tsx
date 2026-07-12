import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthState } from '@/features/auth/session-provider'

/**
 * Placeholder private home. Account settings and product screens arrive later.
 */
export default function ProtectedIndexRoute() {
  const state = useAuthState()
  const email =
    state.status === 'authenticated' ? state.identity.email : 'unknown'

  return (
    <View style={styles.container} testID="private-shell">
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>ZIWEI AI</Text>
        <Text style={styles.subtitle}>{email}</Text>
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
  title: {
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
})
