import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Pressable, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const TOPICS = ['진로·취업', '공부', '관계', '건강', '돈'];
const EMOTIONS = ['불안', '우울', '짜증', '두려움', '부끄러움', '실망', '무기력', '스트레스'];

export default function QuickLog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    addWorry,
    customTopics, customEmotions, addCustomTopic, addCustomEmotion,
    removedTopics, removedEmotions, removeTopicTag, removeEmotionTag,
    editTopicTag, editEmotionTag,
  } = useWorries();

  const activeTopics = [...TOPICS.filter(t => !removedTopics.includes(t)), ...customTopics];
  const activeEmotions = [...EMOTIONS.filter(e => !removedEmotions.includes(e)), ...customEmotions];
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('진로·취업');
  const [emotion, setEmotion] = useState('불안');

  // 선택된 태그가 삭제되면 첫 번째 활성 태그로 교정
  useEffect(() => {
    if (activeTopics.length > 0 && !activeTopics.includes(topic)) {
      setTopic(activeTopics[0]);
    }
  }, [removedTopics, customTopics]);

  useEffect(() => {
    if (activeEmotions.length > 0 && !activeEmotions.includes(emotion)) {
      setEmotion(activeEmotions[0]);
    }
  }, [removedEmotions, customEmotions]);
  const [memo, setMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [addingFor, setAddingFor] = useState<'topic' | 'emotion' | null>(null);
  const [editingFor, setEditingFor] = useState<{ tag: string; type: 'topic' | 'emotion' } | null>(null);
  const [newTagText, setNewTagText] = useState('');

  const launchCamera = async () => {
    setShowPhotoSheet(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const launchGallery = async () => {
    setShowPhotoSheet(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleTagLongPress = (tag: string, type: 'topic' | 'emotion') => {
    Alert.alert(tag, undefined, [
      {
        text: '수정',
        onPress: () => {
          setEditingFor({ tag, type });
          setNewTagText(tag);
        },
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('태그 삭제', `'${tag}' 태그를 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () => {
                if (type === 'topic') {
                  removeTopicTag(tag);
                  if (topic === tag) setTopic(activeTopics.find(t => t !== tag) ?? '');
                } else {
                  removeEmotionTag(tag);
                  if (emotion === tag) setEmotion(activeEmotions.find(e => e !== tag) ?? '');
                }
              },
            },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleConfirmTag = () => {
    const trimmed = newTagText.trim();
    if (!trimmed) return;

    if (editingFor) {
      if (editingFor.type === 'topic') {
        if (trimmed !== editingFor.tag && activeTopics.includes(trimmed)) {
          Alert.alert('중복된 태그', `'${trimmed}' 주제는 이미 있어요.`);
          return;
        }
        editTopicTag(editingFor.tag, trimmed);
        if (topic === editingFor.tag) setTopic(trimmed);
      } else {
        if (trimmed !== editingFor.tag && activeEmotions.includes(trimmed)) {
          Alert.alert('중복된 태그', `'${trimmed}' 감정은 이미 있어요.`);
          return;
        }
        editEmotionTag(editingFor.tag, trimmed);
        if (emotion === editingFor.tag) setEmotion(trimmed);
      }
      setEditingFor(null);
    } else if (addingFor) {
      if (addingFor === 'topic') {
        if (activeTopics.includes(trimmed)) {
          Alert.alert('중복된 태그', `'${trimmed}' 주제는 이미 있어요.`);
          return;
        }
        addCustomTopic(trimmed);
        setTopic(trimmed);
      } else {
        if (activeEmotions.includes(trimmed)) {
          Alert.alert('중복된 태그', `'${trimmed}' 감정은 이미 있어요.`);
          return;
        }
        addCustomEmotion(trimmed);
        setEmotion(trimmed);
      }
      setAddingFor(null);
    }
    setNewTagText('');
  };

  const handleSave = () => {
    if (!text.trim()) return;
    const worryId = addWorry({ text, topic, emotion, memo: memo || undefined, photoUri });
    router.push(`/control/${worryId}`);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>걱정 기록하기</Text>
        <Text style={styles.headerSub}>한 줄이면 충분해요</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.charRow}>
          <View style={styles.charCircle}>
            <Image
              source={require('@/assets/images/생각중.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>무슨 생각하고 있어요?</Text>
          </View>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="취업 준비가 막막하게 느껴져요"
          placeholderTextColor="#9ca3af"
          multiline
          style={styles.mainInput}
        />

        <Text style={styles.fieldLabel}>주제</Text>
        <View style={styles.chipRow}>
          {activeTopics.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, topic === t && styles.chipActive]}
              onPress={() => setTopic(t)}
              onLongPress={() => handleTagLongPress(t, 'topic')}
              delayLongPress={500}
            >
              <Text style={[styles.chipText, topic === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.chipAdd}
            onPress={() => { setAddingFor('topic'); setNewTagText(''); }}
          >
            <Text style={styles.chipAddText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>감정</Text>
        <View style={styles.emotionGrid}>
          {activeEmotions.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emotionChip, emotion === e && styles.chipActive]}
              onPress={() => setEmotion(e)}
              onLongPress={() => handleTagLongPress(e, 'emotion')}
              delayLongPress={500}
            >
              <Text style={[styles.chipText, emotion === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.emotionChip, styles.chipAdd]}
            onPress={() => { setAddingFor('emotion'); setNewTagText(''); }}
          >
            <Text style={styles.chipAddText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.memoLabelRow}>
          <Text style={styles.fieldLabel}>메모 (선택)</Text>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowPhotoSheet(true)}>
            <Ionicons name="camera" size={18} color={Colors.primary} />
            <Text style={styles.cameraBtnText}>사진 첨부</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="더 자세히 적어보세요..."
          placeholderTextColor="#9ca3af"
          multiline
          style={styles.memoInput}
        />

        {photoUri && (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => setPhotoUri(undefined)}
            >
              <Ionicons name="close-circle" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !text.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!text.trim()}
        >
          <Text style={styles.saveButtonText}>저장하기 ✦</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 태그 추가 모달 */}
      <Modal
        visible={addingFor !== null || editingFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => { setAddingFor(null); setEditingFor(null); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.tagModalOuter}
        >
          <Pressable style={styles.tagModalOverlay} onPress={() => { setAddingFor(null); setEditingFor(null); }} />
          <View style={styles.tagModalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {editingFor
                ? (editingFor.type === 'topic' ? '주제 수정' : '감정 수정')
                : (addingFor === 'topic' ? '주제 직접 추가' : '감정 직접 추가')}
            </Text>
            <TextInput
              value={newTagText}
              onChangeText={setNewTagText}
              placeholder={
                (editingFor?.type ?? addingFor) === 'topic'
                  ? '예: 가족, 주거, 취미...'
                  : '예: 걱정, 외로움, 혼란...'
              }
              placeholderTextColor="#9ca3af"
              autoFocus
              style={styles.tagInput}
              onSubmitEditing={handleConfirmTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.tagConfirmBtn, !newTagText.trim() && styles.saveButtonDisabled]}
              onPress={handleConfirmTag}
              disabled={!newTagText.trim()}
            >
              <Text style={styles.tagConfirmText}>{editingFor ? '수정하기' : '추가하기'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 사진 선택 바텀시트 (절대 위치 — Modal 미사용으로 iOS 피커 충돌 방지) */}
      {showPhotoSheet && (
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <Pressable style={styles.sheetOverlay} onPress={() => setShowPhotoSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>사진 첨부</Text>
            <TouchableOpacity style={styles.sheetOption} onPress={launchCamera}>
              <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>카메라로 찍기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={launchGallery}>
              <Ionicons name="image-outline" size={22} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>앨범에서 가져오기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPhotoSheet(false)}>
              <Text style={styles.sheetCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    padding: 24,
    gap: 12,
    paddingBottom: 48,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  mainInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 96,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  memoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: Colors.primaryMuted,
  },
  cameraBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  memoInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  photoPreviewWrap: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 4,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sheetOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  sheetCancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  chipAdd: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#e9e3f4',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  chipAddText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  tagModalOuter: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tagModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tagModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  tagInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  tagConfirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
  },
  tagConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
