import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();

  const currentMonth = new Date().toLocaleDateString('ko-KR', { month: 'long' });
  const totalWorries = worries.length;
  const recurringWorries = worries.filter(w => w.recurring).length;

  const topicCounts = worries.reduce((acc, w) => {
    acc[w.topic] = (acc[w.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topicData = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const maxTopicCount = Math.max(...topicData.map(([, c]) => c), 1);

  const emotionCounts = worries.reduce((acc, w) => {
    acc[w.emotion] = (acc[w.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const keywords = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);

  const maxKeywordCount = Math.max(...keywords.map(([, c]) => c), 1);

  const topTopic = topicData[0]?.[0] || '진로';
  const topEmotion = keywords[0]?.[0] || '불안';
  const topicCount = Object.keys(topicCounts).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>나의 걱정 패턴 ✦</Text>
          <Text style={styles.headerSub}>{currentMonth} · {totalWorries}개 기록</Text>
        </View>

        <View style={styles.body}>
          {/* 통계 3개 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>{totalWorries}</Text>
              <Text style={styles.statLabel}>전체</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#f97316' }]}>{recurringWorries}</Text>
              <Text style={styles.statLabel}>반복</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>{topicCount}</Text>
              <Text style={styles.statLabel}>주제</Text>
            </View>
          </View>

          {/* AI 인사이트 */}
          <View style={styles.insightCard}>
            <View style={styles.insightTitleRow}>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
              <Text style={styles.insightTitle}>AI 인사이트</Text>
            </View>
            <Text style={styles.insightText}>
              이번 달에는 {topTopic} 걱정이 가장 많이 나타났고, {topEmotion} 감정이 반복되었어요.
            </Text>
          </View>

          {/* 카테고리별 빈도 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/category-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>카테고리별 빈도</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
            <View style={styles.barList}>
              {topicData.map(([topic, count]) => (
                <View key={topic} style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>{topic}</Text>
                    <Text style={styles.barCount}>{count}건</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(count / maxTopicCount) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* 키워드 클라우드 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/keyword-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>키워드 클라우드</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
            <View style={styles.cloudWrap}>
              {keywords.map(([keyword, count]) => {
                const fontSize = 12 + (count / maxKeywordCount) * 16;
                return (
                  <Text key={keyword} style={[styles.cloudWord, { fontSize }]}>
                    {keyword}
                  </Text>
                );
              })}
            </View>
          </TouchableOpacity>

          {/* 반복되는 걱정 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>반복되는 걱정</Text>
            <View style={styles.recurringList}>
              {worries.filter(w => w.recurring).slice(0, 3).map(worry => (
                <TouchableOpacity
                  key={worry.id}
                  style={styles.recurringItem}
                  onPress={() => router.push(`/worry/${worry.id}`)}
                >
                  <Text style={styles.recurringText}>{worry.text}</Text>
                  <View style={styles.topicTag}>
                    <Text style={styles.topicTagText}>{worry.topic}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {worries.filter(w => w.recurring).length === 0 && (
                <Text style={styles.emptyText}>반복되는 걱정이 없어요</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  insightCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  barList: {
    gap: 12,
  },
  barItem: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  barCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  barBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  barFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  cloudWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cloudWord: {
    color: Colors.primary,
    fontWeight: '500',
  },
  recurringList: {
    gap: 8,
  },
  recurringItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  recurringText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  topicTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.topicTag,
    borderRadius: 8,
  },
  topicTagText: {
    fontSize: 12,
    color: Colors.topicTagText,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
