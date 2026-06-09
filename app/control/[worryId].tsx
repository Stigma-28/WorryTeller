import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

export default function ControlBranch() {
  const router = useRouter();
  const { worryId } = useLocalSearchParams<{ worryId: string }>();
  const { getWorry, updateWorry } = useWorries();

  const insets = useSafeAreaInsets();
  const worry = worryId ? getWorry(worryId) : undefined;

  useEffect(() => {
    if (!worry) router.replace('/home');
  }, [worry]);

  if (!worry) return null;

  const handleChoice = (canChange: boolean) => {
    updateWorry(worry.id, { canChange });
    router.push('/matrix');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: 16 + insets.top }]}>
        <TouchableOpacity onPress={() => router.push('/home')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topBarText}>방금 저장됨</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.worryCard}>
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

        <View style={styles.charRow}>
          <View style={styles.charCircle}>
            <Text style={styles.charLabel}>타로멍{'\n'}자리</Text>
          </View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>이 걱정을 바꿀 수 있나요?</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.choiceGreen} onPress={() => handleChoice(true)}>
          <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
          <View style={styles.choiceTextCol}>
            <Text style={styles.choiceTitleGreen}>바꿀 수 있어요</Text>
            <Text style={styles.choiceSubGreen}>→ 할 일 만들기</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.choiceYellow} onPress={() => handleChoice(false)}>
          <Ionicons name="close-circle" size={32} color="#d97706" />
          <View style={styles.choiceTextCol}>
            <Text style={styles.choiceTitleYellow}>바꿀 수 없어요</Text>
            <Text style={styles.choiceSubYellow}>→ 받아들이기</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.hint}>
          <Text style={styles.hintText}>✦ 언제든 다시 분류할 수 있어요</Text>
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
  topBarText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  body: {
    padding: 24,
    gap: 16,
  },
  worryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  worryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topicTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.topicTag,
    borderRadius: 8,
  },
  topicTagText: {
    fontSize: 13,
    color: Colors.topicTagText,
  },
  emotionTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.emotionTag,
    borderRadius: 8,
  },
  emotionTagText: {
    fontSize: 13,
    color: Colors.emotionTagText,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  charCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  charLabel: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 10,
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
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  choiceGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 16,
  },
  choiceYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#fefce8',
    borderWidth: 2,
    borderColor: '#fef08a',
    borderRadius: 16,
  },
  choiceTextCol: {
    gap: 4,
  },
  choiceTitleGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d',
  },
  choiceSubGreen: {
    fontSize: 14,
    color: '#16a34a',
  },
  choiceTitleYellow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#713f12',
  },
  choiceSubYellow: {
    fontSize: 14,
    color: '#d97706',
  },
  hint: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: Colors.primary,
  },
});
