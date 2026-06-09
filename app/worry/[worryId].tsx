import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  if (weeks === 0) return '오늘';
  if (weeks === 1) return '1주 전';
  return `${weeks}주 전`;
}

export default function WorryDetail() {
  const router = useRouter();
  const { worryId } = useLocalSearchParams<{ worryId: string }>();
  const { getWorry, updateWorry, deleteWorry, worries } = useWorries();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  const insets = useSafeAreaInsets();
  const worry = worryId ? getWorry(worryId) : undefined;

  useEffect(() => {
    if (!worry) router.replace('/home');
  }, [worry]);

  if (!worry) return null;

  const handleReclassify = (canChange: boolean) => {
    updateWorry(worry.id, { canChange });
  };

  const handleDelete = () => {
    deleteWorry(worry.id);
    router.replace('/home');
  };

  const similarWorries = worries
    .filter(w => w.id !== worry.id && (w.topic === worry.topic || w.emotion === worry.emotion))
    .slice(0, 2);

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={[styles.topBar, { paddingTop: 16 + insets.top }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>걱정 상세</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 걱정 카드 */}
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
          <Text style={styles.dateText}>{formatDate(worry.createdAt)}</Text>
          {worry.memo && (
            <View style={styles.memoSection}>
              <Text style={styles.memoText}>{worry.memo}</Text>
            </View>
          )}
          {worry.photoUri && (
            <TouchableOpacity
              style={styles.photoWrap}
              onPress={() => setShowPhotoViewer(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: worry.photoUri }}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.photoHint}>
                <Ionicons name="expand-outline" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 다시 분류하기 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>다시 분류하기</Text>
          <View style={styles.reclassifyRow}>
            <TouchableOpacity
              style={[styles.reclassifyBtn, worry.canChange === true && styles.reclassifyBtnGreen]}
              onPress={() => handleReclassify(true)}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={worry.canChange === true ? '#16a34a' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.reclassifyText,
                  worry.canChange === true && styles.reclassifyTextGreen,
                ]}
              >
                바꿀 수 있음
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reclassifyBtn,
                worry.canChange === false && styles.reclassifyBtnYellow,
              ]}
              onPress={() => handleReclassify(false)}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={worry.canChange === false ? '#d97706' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.reclassifyText,
                  worry.canChange === false && styles.reclassifyTextYellow,
                ]}
              >
                바꿀 수 없음
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI 인사이트 */}
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={styles.insightTitle}>AI 인사이트</Text>
          </View>
          <Text style={styles.insightText}>
            이 걱정은 지난달에 3번 나타났어요. {worry.topic}·{worry.emotion} 패턴이 반복되고 있어요.
          </Text>
        </View>

        {/* 과거 비슷한 걱정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>과거 비슷한 걱정</Text>
          {similarWorries.length > 0 ? (
            <View style={styles.similarList}>
              {similarWorries.map(w => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.similarCard}
                  onPress={() => router.push(`/worry/${w.id}`)}
                >
                  <Text style={styles.similarDate}>{formatDate(w.createdAt)}</Text>
                  <Text style={styles.similarText}>{w.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>비슷한 걱정이 처음이에요</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteConfirm(false)}>
          <Pressable style={styles.deleteModal} onPress={() => {}}>
            <Text style={styles.deleteTitle}>걱정 삭제</Text>
            <Text style={styles.deleteSub}>이 걱정을 삭제하시겠어요?</Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleDelete}>
                <Text style={styles.deleteConfirmBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 사진 전체화면 뷰어 */}
      <Modal visible={showPhotoViewer} transparent animationType="fade">
        <View style={styles.viewerContainer}>
          <Image
            source={{ uri: worry.photoUri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setShowPhotoViewer(false)}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  worryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  worryText: {
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 26,
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
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  memoSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  memoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  photoWrap: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerClose: {
    position: 'absolute',
    top: 52,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reclassifyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reclassifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  reclassifyBtnGreen: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  reclassifyBtnYellow: {
    borderColor: '#fde68a',
    backgroundColor: '#fefce8',
  },
  reclassifyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  reclassifyTextGreen: {
    color: '#15803d',
  },
  reclassifyTextYellow: {
    color: '#92400e',
  },
  insightCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  insightRow: {
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
  similarList: {
    gap: 8,
  },
  similarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  similarDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  similarText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  // 삭제 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 8,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  deleteSub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  deleteBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
});
