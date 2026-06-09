import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  const { addWorry } = useWorries();
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('진로·취업');
  const [emotion, setEmotion] = useState('불안');
  const [memo, setMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

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

  const handleSave = () => {
    if (!text.trim()) return;
    const worryId = addWorry({ text, topic, emotion, memo: memo || undefined, photoUri });
    router.push(`/control/${worryId}`);
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.charLabel}>타로멍{'\n'}자리</Text>
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
          {TOPICS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, topic === t && styles.chipActive]}
              onPress={() => setTopic(t)}
            >
              <Text style={[styles.chipText, topic === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>감정</Text>
        <View style={styles.emotionGrid}>
          {EMOTIONS.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emotionChip, emotion === e && styles.chipActive]}
              onPress={() => setEmotion(e)}
            >
              <Text style={[styles.chipText, emotion === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
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
    </View>
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
