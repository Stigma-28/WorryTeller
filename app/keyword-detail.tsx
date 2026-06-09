import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const DIST_COLORS = ['#f97316', '#fbbf24', '#facc15', '#a3e635', '#34d399'];

export default function KeywordDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();

  const emotionCounts = useMemo(() =>
    worries.reduce((acc, w) => {
      acc[w.emotion] = (acc[w.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    [worries]
  );

  const keywords = useMemo(() =>
    Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 9),
    [emotionCounts]
  );

  const maxCount = Math.max(...keywords.map(([, c]) => c), 1);
  const getFontSize = (count: number) => 14 + (count / maxCount) * 22;

  const [selected, setSelected] = useState<string>(keywords[0]?.[0] ?? '');

  const relatedWorries = useMemo(() =>
    worries.filter(w => w.emotion === selected),
    [worries, selected]
  );

  const topicDistribution = useMemo(() => {
    const counts = relatedWorries.reduce((acc, w) => {
      acc[w.topic] = (acc[w.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const total = relatedWorries.length || 1;
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([topic, count]) => ({
        label: topic,
        percentage: Math.round((count / total) * 100),
      }));
  }, [relatedWorries]);

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={[styles.topBar, { paddingTop: 16 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>키워드 클라우드 상세</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 키워드 클라우드 */}
        <View style={styles.cloudCard}>
          {keywords.length === 0 ? (
            <Text style={styles.emptyText}>아직 기록된 걱정이 없어요</Text>
          ) : (
            <View style={styles.cloudWrap}>
              {keywords.map(([keyword, count]) => {
                const isSelected = selected === keyword;
                return (
                  <TouchableOpacity
                    key={keyword}
                    onPress={() => setSelected(keyword)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cloudWord,
                        { fontSize: getFontSize(count) },
                        isSelected ? styles.cloudWordSelected : styles.cloudWordDefault,
                      ]}
                    >
                      {keyword}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 선택된 키워드 상세 */}
        {selected !== '' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              "{selected}" 관련 걱정 ({relatedWorries.length}건)
            </Text>

            {topicDistribution.length > 0 && (
              <View style={styles.distSection}>
                <Text style={styles.distLabel}>관련 주제 분포</Text>
                <View style={styles.distList}>
                  {topicDistribution.map((item, i) => (
                    <View key={item.label} style={styles.distRow}>
                      <View style={styles.distLabelRow}>
                        <Text style={styles.distTopic}>{item.label}</Text>
                        <Text style={styles.distPct}>{item.percentage}%</Text>
                      </View>
                      <View style={styles.distBarBg}>
                        <View
                          style={[
                            styles.distBarFill,
                            {
                              width: `${item.percentage}%`,
                              backgroundColor: DIST_COLORS[i] ?? DIST_COLORS[DIST_COLORS.length - 1],
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 관련 걱정 목록 */}
        {relatedWorries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>관련 걱정</Text>
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
                </TouchableOpacity>
              ))}
            </View>
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
  cloudCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  cloudWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cloudWord: {
    fontWeight: '500',
  },
  cloudWordSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  cloudWordDefault: {
    color: '#a089c4',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
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
  // 주제 분포
  distSection: {
    gap: 12,
  },
  distLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  distList: {
    gap: 10,
  },
  distRow: {
    gap: 4,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distTopic: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  distPct: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  distBarBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  distBarFill: {
    height: 8,
    borderRadius: 4,
  },
  // 관련 걱정
  worryList: {
    gap: 8,
  },
  worryItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
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
});
