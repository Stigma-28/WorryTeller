import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const BAR_COLORS = ['#6C5A8E', '#7d6b9d', '#9483b3', '#b5a3cb', '#c4b5d8', '#d4c4e8'];
const CHART_H = 160;

export default function CategoryDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const isCurrentMonth =
    selectedMonth.getFullYear() === today.getFullYear() &&
    selectedMonth.getMonth() === today.getMonth();

  const goToPrevMonth = () =>
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  const inMonth = (date: Date, ref: Date) =>
    date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();

  const prevMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);

  const currentWorries = worries.filter(w => inMonth(new Date(w.createdAt), selectedMonth));
  const prevWorries = worries.filter(w => inMonth(new Date(w.createdAt), prevMonthStart));

  const countByTopic = (list: typeof worries) =>
    list.reduce((acc, w) => {
      acc[w.topic] = (acc[w.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const currentCounts = countByTopic(currentWorries);
  const prevCounts = countByTopic(prevWorries);

  const topicData = Object.entries(currentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxCount = Math.max(...topicData.map(([, c]) => c), 1);

  const topTopic = topicData[0]?.[0] ?? '';
  const relatedWorries = currentWorries.filter(w => w.topic === topTopic).slice(0, 6);

  const trendData = topicData.slice(0, 3).map(([topic]) => {
    const curr = currentCounts[topic] || 0;
    const prev = prevCounts[topic] || 0;
    const diff = curr - prev;
    return {
      category: topic,
      change: diff > 0 ? `+${diff}건` : diff < 0 ? `${diff}건` : '동일',
      trend: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'same' as const,
    };
  });

  const monthLabel = selectedMonth.toLocaleDateString('ko-KR', { month: 'long' });

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: 16 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>카테고리별 빈도 상세</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 월 선택 */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthActive}>{monthLabel}</Text>
          {isCurrentMonth ? (
            <View style={{ width: 20 }} />
          ) : (
            <TouchableOpacity
              onPress={() =>
                setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 세로 바 차트 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 분포</Text>

          {topicData.length === 0 ? (
            <Text style={styles.emptyText}>이 달에 기록된 걱정이 없어요</Text>
          ) : (
            <View style={styles.chartArea}>
              <View style={styles.yAxis}>
                <Text style={styles.yLabel}>{maxCount}</Text>
                <Text style={styles.yLabel}>{Math.ceil(maxCount * 2 / 3)}</Text>
                <Text style={styles.yLabel}>{Math.ceil(maxCount / 3)}</Text>
                <Text style={styles.yLabel}>0</Text>
              </View>

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
                      <Text style={styles.barLabel} numberOfLines={2}>{topic}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 지난달 대비 */}
        {trendData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>지난달 대비</Text>
            {trendData.map((item, i) => (
              <View key={item.category} style={[styles.trendRow, i > 0 && styles.trendRowBorder]}>
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
                  {item.trend === 'up' && <Ionicons name="trending-up" size={16} color="#dc2626" />}
                  {item.trend === 'down' && <Ionicons name="trending-down" size={16} color="#2563eb" />}
                  {item.trend === 'same' && <Ionicons name="remove" size={16} color="#9ca3af" />}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 관련 걱정 목록 */}
        {topTopic !== '' && (
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
        )}
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
    gap: 24,
  },
  monthActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    minWidth: 40,
    textAlign: 'center',
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
