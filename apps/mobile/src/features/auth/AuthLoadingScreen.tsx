import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface AuthLoadingScreenProps {
  message?: string
}

export function AuthLoadingScreen({
  message = 'Đang kiểm tra phiên đăng nhập...',
}: AuthLoadingScreenProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="progressbar"
      style={styles.container}
      testID="auth-loading-screen"
    >
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.message}>{message}</Text>
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
  },
  message: {
    color: '#1e293b',
    fontSize: 16,
    textAlign: 'center',
  },
})
