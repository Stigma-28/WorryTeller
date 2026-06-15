import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';
import { filterThisMonth, filterToday, generateInsights } from '@/utils/insights';
import { generateInsight, InsightInput } from '@/utils/generateInsight';

type Period = 'month' | 'today';

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();
  const [period, setPeriod] = useState<Period>('month');

  const monthWorries = filterThisMonth(worries);
  const todayWorries = filterToday(worries);
  const periodWorries = period === 'month' ? monthWorries : todayWorries;

  // 기간별 통계
  const totalCount = periodWorries.length;
  const recurringCount = periodWorries.filter(w => w.recurring).length;
  const topicCount = new Set(periodWorries.map(w => w.topic)).size;

  // 인사이트 문장들 (폴백용)
  const insights = generateInsights(periodWorries, period);

  // AI 인사이트
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  useEffect(() => {
    if (periodWorries.length === 0) {
      setAiInsight(null);
      return;
    }
    const tCounts = periodWorries.reduce((acc, w) => {
      acc[w.topic] = (acc[w.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const eCounts = periodWorries.reduce((acc, w) => {
      acc[w.emotion] = (acc[w.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const input: InsightInput = {
      period,
      totalCount: periodWorries.length,
      topicCounts: tCounts,
      emotionCounts: eCounts,
      canChangeCount: periodWorries.filter(w => w.canChange === true).length,
      cannotChangeCount: periodWorries.filter(w => w.canChange === false).length,
    };
    setAiInsightLoading(true);
    generateInsight(input).then(result => {
      setAiInsight(result);
      setAiInsightLoading(false);
    });
  }, [period, worries]);

  // 카테고리 차트 — 선택된 기간 기준
  const topicCounts = periodWorries.reduce((acc, w) => {
    acc[w.topic] = (acc[w.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topicData = Object.entries(topicCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxTopicCount = Math.max(...topicData.map(([, c]) => c), 1);

  // 키워드 클라우드 — 선택된 기간 기준
  const emotionCounts = periodWorries.reduce((acc, w) => {
    acc[w.emotion] = (acc[w.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const keywords = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a).slice(0, 8);
  const maxKeywordCount = Math.max(...keywords.map(([, c]) => c), 1);

  // 자주 하는 걱정 — 선택된 기간 내 주제별 빈도 상위 3개, 각 주제당 랜덤 1개
  const recurringSpotlight = useMemo(() => {
    if (periodWorries.length === 0) return [];
    const counts = periodWorries.reduce((acc, w) => {
      acc[w.topic] = (acc[w.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const top3 = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    return top3.map(([topic, count]) => {
      const pool = periodWorries.filter(w => w.topic === topic);
      return { worry: pool[Math.floor(Math.random() * pool.length)], topic, count };
    });
  }, [periodWorries]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('ko-KR', { month: 'long' });
  const todayLabel = now.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>나의 걱정 패턴 ✦</Text>
          <Text style={styles.headerSub}>
            {period === 'month' ? `${monthLabel} · ${totalCount}개 기록` : `${todayLabel} · ${totalCount}개 기록`}
          </Text>

          {/* 기간 토글 */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, period === 'month' && styles.toggleBtnActive]}
              onPress={() => setPeriod('month')}
            >
              <Text style={[styles.toggleText, period === 'month' && styles.toggleTextActive]}>
                이번 달
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, period === 'today' && styles.toggleBtnActive]}
              onPress={() => setPeriod('today')}
            >
              <Text style={[styles.toggleText, period === 'today' && styles.toggleTextActive]}>
                오늘
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {/* 통계 3개 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>{totalCount}</Text>
              <Text style={styles.statLabel}>전체</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#f97316' }]}>{recurringCount}</Text>
              <Text style={styles.statLabel}>반복</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>{topicCount}</Text>
              <Text style={styles.statLabel}>주제</Text>
            </View>
          </View>

          {/* 걱정 분석 카드 */}
          <View style={styles.insightCard}>
            <View style={styles.insightTitleRow}>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
              <Text style={styles.insightTitle}>걱정 분석</Text>
              {aiInsight ? (
                <Text style={styles.insightAiBadge}>AI 분석</Text>
              ) : (
                <Text style={styles.insightPeriodBadge}>
                  {period === 'month' ? '이번 달' : '오늘'}
                </Text>
              )}
            </View>
            {aiInsightLoading ? (
              <View style={styles.insightRow}>
                <Text style={styles.insightBullet}>✦</Text>
                <Text style={styles.insightText}>AI가 분석 중...</Text>
              </View>
            ) : aiInsight ? (
              <View style={styles.insightRow}>
                <Text style={styles.insightBullet}>✦</Text>
                <Text style={styles.insightText}>{aiInsight}</Text>
              </View>
            ) : (
              insights.map((text, i) => (
                <View key={i} style={styles.insightRow}>
                  <Text style={styles.insightBullet}>✦</Text>
                  <Text style={styles.insightText}>{text}</Text>
                </View>
              ))
            )}
          </View>

          {/* 카테고리별 빈도 (이번 달) */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/category-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>카테고리별 빈도</Text>
                <Text style={styles.cardSub}>{period === 'month' ? '이번 달 기준' : '오늘 기준'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
            {topicData.length > 0 ? (
              <View style={styles.barList}>
                {topicData.map(([topic, count]) => (
                  <View key={topic} style={styles.barItem}>
                    <View style={styles.barLabelRow}>
                      <Text style={styles.barLabel}>{topic}</Text>
                      <Text style={styles.barCount}>{count}건</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View
                        style={[styles.barFill, { width: `${(count / maxTopicCount) * 100}%` }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>이번 달 기록이 없어요</Text>
            )}
          </TouchableOpacity>

          {/* 감정 키워드 클라우드 (이번 달) */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/keyword-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>감정 키워드</Text>
                <Text style={styles.cardSub}>{period === 'month' ? '이번 달 기준' : '오늘 기준'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
            {keywords.length > 0 ? (
              <View style={styles.cloudWrap}>
                {keywords.map(([keyword, count]) => {
                  const fontSize = 12 + (count / maxKeywordCount) * 14;
                  return (
                    <Text key={keyword} style={[styles.cloudWord, { fontSize }]}>
                      {keyword}
                    </Text>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>이번 달 기록이 없어요</Text>
            )}
          </TouchableOpacity>

          {/* 반복되는 걱정 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>자주 하는 걱정</Text>
            {recurringSpotlight.length > 0 ? (
              <View style={styles.recurringList}>
                {recurringSpotlight.map(({ worry, topic, count }, index) => (
                  <TouchableOpacity
                    key={worry.id}
                    style={styles.recurringItem}
                    onPress={() => router.push(`/worry/${worry.id}`)}
                  >
                    <View style={styles.recurringHeader}>
                      <Text style={styles.recurringRank}>{index + 1}위</Text>
                      <View style={styles.topicTag}>
                        <Text style={styles.topicTagText}>{topic}</Text>
                      </View>
                      <Text style={styles.recurringCount}>{count}건</Text>
                    </View>
                    <Text style={styles.recurringText}>{worry.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>기록된 걱정이 없어요</Text>
            )}
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
    paddingBottom: 28,
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
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  toggleTextActive: {
    color: Colors.primary,
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
    padding: 20,
    gap: 10,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  insightPeriodBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  insightAiBadge: {
    fontSize: 11,
    color: Colors.primary,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    fontWeight: '600',
  },
  insightRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  insightBullet: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  cardSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
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
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringRank: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    minWidth: 24,
  },
  recurringCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 'auto',
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
