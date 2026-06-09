import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const BAR_COLORS = ['#6C5A8E', '#7d6b9d', '#9483b3', '#b5a3cb', '#c4b5d8', '#d4c4e8'];
const CHART_H = 160;

const TREND_DATA = [
  { category: '진로·취업', change: '+2건', trend: 'up' as const },
  { category: '관계', change: '-1건', trend: 'down' as const },
  { category: '공부', change: '동일', trend: 'same' as const },
];

export default function CategoryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();

  const currentMonth = new Date().toLocaleDateString('ko-KR', { month: 'long' });

  const topicCounts = worries.reduce((acc, w) => {
    acc[w.topic] = (acc[w.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topicData = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxCount = Math.max(...topicData.map(([, c]) => c), 1);

  const topTopic = topicData[0]?.[0] ?? '진로·취업';
  const relatedWorries = worries
    .filter(w => w.topic === topTopic)
    .slice(0, 6);

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={[styles.topBar, { paddingTop: 16 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>카테고리별 빈도 상세</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 월 선택 (장식) */}
        <View style={styles.monthRow}>
          <Ionicons name="chevron-back" size={20} color="#d1d5db" />
          <View style={styles.monthLabels}>
            <Text style={styles.monthInactive}>지난달</Text>
            <Text style={styles.monthActive}>{currentMonth}</Text>
            <Text style={styles.monthInactive}>다음달</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
        </View>

        {/* 세로 바 차트 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 분포</Text>

          {topicData.length === 0 ? (
            <Text style={styles.emptyText}>아직 기록된 걱정이 없어요</Text>
          ) : (
            <View style={styles.chartArea}>
              {/* Y축 레이블 */}
              <View style={styles.yAxis}>
                <Text style={styles.yLabel}>{maxCount}</Text>
                <Text style={styles.yLabel}>{Math.ceil(maxCount * 2 / 3)}</Text>
                <Text style={styles.yLabel}>{Math.ceil(maxCount / 3)}</Text>
                <Text style={styles.yLabel}>0</Text>
              </View>

              {/* 바 */}
              <View style={styles.barsRow}>
                {topicData.map(([topic, count], index) => {
                  const barH = (count / maxCount) * CHART_H;
                  return (
                    <View key={topic} style={styles.barColumn}>
                      <Text style={styles.barValue}>{count}</Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barH,
                            backgroundColor: BAR_COLORS[index] ?? BAR_COLORS[BAR_COLORS.length - 1],
                          },
                        ]}
                      />
                      <Text style={styles.barLabel} numberOfLines={2}>
                        {topic}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 지난달 대비 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>지난달 대비</Text>
          {TREND_DATA.map((item, i) => (
            <View
              key={item.category}
              style={[styles.trendRow, i > 0 && styles.trendRowBorder]}
            >
              <Text style={styles.trendCategory}>{item.category}</Text>
              <View style={styles.trendRight}>
                <Text
                  style={[
                    styles.trendChange,
                    item.trend === 'up' && styles.trendUp,
                    item.trend === 'down' && styles.trendDown,
                    item.trend === 'same' && styles.trendSame,
                  ]}
                >
                  {item.change}
                </Text>
                {item.trend === 'up' && (
                  <Ionicons name="trending-up" size={16} color="#dc2626" />
                )}
                {item.trend === 'down' && (
                  <Ionicons name="trending-down" size={16} color="#2563eb" />
                )}
                {item.trend === 'same' && (
                  <Ionicons name="remove" size={16} color="#9ca3af" />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 관련 걱정 목록 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {topTopic} 걱정 목록 ({relatedWorries.length}건)
          </Text>
          {relatedWorries.length === 0 ? (
            <Text style={styles.emptyText}>해당 카테고리 걱정이 없어요</Text>
          ) : (
            <View style={styles.worryList}>
              {relatedWorries.map(worry => (
                <TouchableOpacity
                  key={worry.id}
                  style={styles.worryItem}
                  onPress={() => router.push(`/worry/${worry.id}`)}
                >
                  <View style={styles.worryItemTop}>
                    <Text style={styles.worryItemText}>{worry.text}</Text>
                    <Text style={styles.worryItemDate}>
                      {new Date(worry.createdAt).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.emotionTag}>
                    <Text style={styles.emotionTagText}>{worry.emotion}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  body: {
    padding: 24,
    gap: 16,
    paddingBottom: 48,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  monthLabels: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  monthActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  monthInactive: {
    fontSize: 14,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  // 바 차트
  chartArea: {
    flexDirection: 'row',
    height: CHART_H + 40,
    gap: 8,
  },
  yAxis: {
    width: 20,
    height: CHART_H,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  yLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: CHART_H + 40,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_H + 40,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  // 지난달 대비
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  trendRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  trendCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  trendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  trendUp: { color: '#dc2626' },
  trendDown: { color: '#2563eb' },
  trendSame: { color: '#9ca3af' },
  // 걱정 목록
  worryList: {
    gap: 8,
  },
  worryItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  worryItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  worryItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  worryItemDate: {
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  emotionTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.emotionTag,
    borderRadius: 8,
  },
  emotionTagText: {
    fontSize: 12,
    color: Colors.emotionTagText,
  },
});
