import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

/**
 * Placeholder public auth entry. Full signup/login UX arrives in later tickets.
 */
export default function AuthIndexRoute() {
  return (
    <View style={styles.container} testID="public-auth-shell">
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>
          Vui lòng đăng nhập để sử dụng ZIWEI AI.
        </Text>
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
