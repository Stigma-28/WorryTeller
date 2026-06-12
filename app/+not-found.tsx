import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Worry Teller' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>✦</Text>
        <Text style={styles.title}>페이지를 찾을 수 없어요</Text>
        <Link href="/home" style={styles.button}>
          홈으로 돌아가기
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 48,
    color: Colors.primary,
  },
  title: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  button: {
    fontSize: 15,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
