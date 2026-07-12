import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

/**
 * Public auth entry. Full sign-in UX arrives in a later ticket (#8).
 */
export default function AuthIndexRoute() {
  return (
    <View style={styles.container} testID="public-auth-shell">
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Dang nhap</Text>
        <Text style={styles.subtitle}>
          Vui long dang nhap de su dung ZIWEI AI.
        </Text>
        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={styles.linkText}>Tao tai khoan moi</Text>
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
    marginTop: 24,
  },
  linkText: {
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
