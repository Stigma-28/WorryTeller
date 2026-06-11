import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries, notificationsEnabled, setNotificationsEnabled } = useWorries();

  const recurringCount = worries.filter(w => w.recurring).length;
  const resolvedCount = worries.filter(w => w.canChange !== undefined).length;

  const topicCounts = worries.reduce((acc, w) => {
    acc[w.topic] = (acc[w.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTopic = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>안녕하세요 ✦</Text>
          <Text style={styles.headerSub}>오늘 마음은 어때요?</Text>
        </View>

        <View style={styles.body}>
          {/* 캐릭터 + 말풍선 */}
          <View style={styles.charRow}>
            <Image
              source={require('@/assets/images/생각중.png')}
              style={styles.charCircle}
              resizeMode="contain"
            />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                {topTopic ? `${topTopic} 걱정이 이번 달 가장 많아요` : '오늘 걱정을 기록해봐요 ✦'}
              </Text>
            </View>
          </View>

          {/* 이번 달 기록 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>이번 달 기록</Text>
              <Text style={styles.cardCount}>{worries.length}</Text>
            </View>
            <Text style={styles.cardSub}>반복 {recurringCount}개 · 해결 {resolvedCount}개</Text>
            <View style={styles.chipRow}>
              <View style={[styles.chip, styles.chipGreen]}>
                <Text style={styles.chipGreenText}>반복 {recurringCount}개</Text>
              </View>
              <View style={[styles.chip, styles.chipAmber]}>
                <Text style={styles.chipAmberText}>해결 {resolvedCount}개</Text>
              </View>
            </View>
          </View>

          {/* 최근 걱정 목록 */}
          <Text style={styles.sectionTitle}>최근 걱정</Text>
          {worries.map(worry => (
            <TouchableOpacity
              key={worry.id}
              style={styles.worryCard}
              onPress={() => router.push(`/worry/${worry.id}`)}
            >
              <View style={styles.worryCardRow}>
                <View style={styles.worryCardMain}>
                  <Text style={styles.worryText}>{worry.text}</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.topicTag}>
                      <Text style={styles.topicTagText}>{worry.topic}</Text>
                    </View>
                    <View style={styles.emotionTag}>
                      <Text style={styles.emotionTagText}>{worry.emotion}</Text>
                    </View>
                  </View>
                </View>
                {worry.photoUri && (
                  <Image
                    source={{ uri: worry.photoUri }}
                    style={styles.worryThumb}
                    resizeMode="cover"
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 알림 토글 버튼 */}
      <TouchableOpacity
        style={[styles.fab, styles.fabLeft]}
        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
      >
        <Ionicons
          name={notificationsEnabled ? 'notifications' : 'notifications-off'}
          size={24}
          color="#ffffff"
        />
      </TouchableOpacity>

      {/* 걱정 추가 버튼 */}
      <TouchableOpacity
        style={[styles.fab, styles.fabRight]}
        onPress={() => router.push('/log')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  charCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    flexShrink: 0,
    overflow: 'hidden',
  },
  bubble: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderTopLeftRadius: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cardCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  chipGreen: {
    backgroundColor: '#d1fae5',
  },
  chipGreenText: {
    fontSize: 13,
    color: '#065f46',
  },
  chipAmber: {
    backgroundColor: '#fef3c7',
  },
  chipAmberText: {
    fontSize: 13,
    color: '#92400e',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  worryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  worryCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  worryCardMain: {
    flex: 1,
    gap: 8,
  },
  worryText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  worryThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    flexShrink: 0,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topicTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.topicTag,
    borderRadius: 8,
  },
  topicTagText: {
    fontSize: 12,
    color: Colors.topicTagText,
  },
  emotionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.emotionTag,
    borderRadius: 8,
  },
  emotionTagText: {
    fontSize: 12,
    color: Colors.emotionTagText,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabLeft: {
    left: 24,
    backgroundColor: Colors.primary,
  },
  fabRight: {
    right: 24,
    backgroundColor: Colors.primary,
  },
});
