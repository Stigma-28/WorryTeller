import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: 48 + insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.characterBox}>
          <Image
            source={require('@/assets/images/생각중.png')}
            style={styles.characterImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Worry Teller</Text>

        <View style={styles.quoteBox}>
          <Text style={styles.quote}>"걱정을 해결하지 않아도 괜찮아요.</Text>
          <Text style={styles.quote}>먼저 이해하는 것부터 시작해요."</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  characterBox: {
    width: 148,
    height: 148,
    backgroundColor: '#ffffff',
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  characterImage: {
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quoteBox: {
    alignItems: 'center',
    gap: 4,
  },
  quote: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
