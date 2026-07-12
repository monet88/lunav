import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { accountCopy } from '@/features/account/account-copy'
import { useAuthState } from '@/features/auth/session-provider'

/**
 * Private shell entry. Product screens land later; account settings is the
 * first confirmed-auth destination beyond this home surface.
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
        <Link href="/(protected)/account" style={styles.link}>
          <Text style={styles.linkText}>{accountCopy('account.title')}</Text>
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
  link: {
    marginTop: 20,
  },
  linkText: {
    color: '#208AEF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
