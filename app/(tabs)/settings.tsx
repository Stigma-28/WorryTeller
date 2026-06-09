import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const PRESET_MESSAGES = [
  '생각을 데이터로 털어내고 편히 주무세요',
  '오늘 하루 어땠나요? 한 줄만 적어봐요',
  '걱정을 기록하면 마음이 가벼워져요',
];

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? '오후' : '오전';
  const displayHour = hour % 12 || 12;
  return `${ampm} ${displayHour}:${minutes}`;
}

function timeStringToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function Settings() {
  const { worries, notificationsEnabled, setNotificationsEnabled, notificationTime, setNotificationTime } =
    useWorries();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);

  const [tempTime, setTempTime] = useState(notificationTime);
  const [tempTimeDate, setTempTimeDate] = useState(() => timeStringToDate(notificationTime));
  const [selectedMessage, setSelectedMessage] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const insets = useSafeAreaInsets();
  const [exportPeriod, setExportPeriod] = useState<'month' | 'all'>('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'text'>('pdf');

  const handleSaveTime = () => {
    setNotificationTime(Platform.OS === 'web' ? tempTime : dateToTimeString(tempTimeDate));
    setShowTimePicker(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>알림 및 설정 ✦</Text>
        </View>

        <View style={styles.body}>
          {/* 안내 카드 */}
          <View style={styles.infoCard}>
            <Ionicons name="notifications" size={24} color="#ffffff" style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>생각을 데이터로 털어내고 편하게 주무세요</Text>
          </View>

          {/* 설정 목록 */}
          <View style={styles.settingsList}>
            {/* 알림 받기 */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>알림 받기</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: Colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            {/* 알림 시간 */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                setTempTime(notificationTime);
                setTempTimeDate(timeStringToDate(notificationTime));
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.settingLabel}>알림 시간</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>{formatTime(notificationTime)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 맞춤 알림 문구 */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowCustomMessage(true)}
            >
              <Text style={styles.settingLabel}>맞춤 알림 문구</Text>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 계정 관리 */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowAccountManagement(true)}
            >
              <Text style={styles.settingLabel}>계정 관리</Text>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 데이터 내보내기 */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowDataExport(true)}
            >
              <Text style={styles.settingLabel}>데이터 내보내기</Text>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── 알림 시간 모달 ── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <Pressable style={styles.overlayBottom} onPress={() => setShowTimePicker(false)}>
          <Pressable style={styles.timePickerSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timePickerCancel}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>알림 시간</Text>
              <TouchableOpacity onPress={handleSaveTime}>
                <Text style={styles.timePickerSave}>저장</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' ? (
              <TextInput
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="21:00"
                keyboardType="numbers-and-punctuation"
                style={styles.timeInput}
              />
            ) : (
              <DateTimePicker
                value={tempTimeDate}
                mode="time"
                display="spinner"
                onChange={(_, date) => { if (date) setTempTimeDate(date); }}
                locale="ko-KR"
                themeVariant="light"
                style={{ width: '100%' }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 맞춤 알림 문구 바텀시트 ── */}
      <Modal visible={showCustomMessage} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.overlayBottom} onPress={() => setShowCustomMessage(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>맞춤 알림 문구</Text>
            <Text style={styles.modalSub}>보낼 문구를 선택하거나 직접 입력해요</Text>

            <View style={styles.messageList}>
              {PRESET_MESSAGES.map((msg, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.messageOption,
                    selectedMessage === index && styles.messageOptionActive,
                  ]}
                  onPress={() => setSelectedMessage(index)}
                >
                  <View
                    style={[
                      styles.radio,
                      selectedMessage === index && styles.radioActive,
                    ]}
                  >
                    {selectedMessage === index && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.messageText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customInputSection}>
              <Text style={styles.fieldLabel}>직접 입력</Text>
              <TextInput
                value={customMessage}
                onChangeText={text => text.length <= 40 && setCustomMessage(text)}
                placeholder="나만의 문구를 입력해요..."
                placeholderTextColor="#9ca3af"
                multiline
                style={styles.customInput}
              />
              <Text style={styles.charCount}>{customMessage.length} / 40</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetSaveBtn}
              onPress={() => setShowCustomMessage(false)}
            >
              <Text style={styles.sheetSaveBtnText}>저장하기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 계정 관리 바텀시트 ── */}
      <Modal visible={showAccountManagement} transparent animationType="slide">
        <Pressable
          style={styles.overlayBottom}
          onPress={() => setShowAccountManagement(false)}
        >
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>계정 관리</Text>

            <View style={styles.accountCard}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>타로멍{'\n'}자리</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>사용자</Text>
                <Text style={styles.accountEmail}>user@email.com</Text>
              </View>
              <Text style={styles.editLink}>편집 &gt;</Text>
            </View>

            <View style={styles.accountList}>
              {['닉네임 변경', '이메일 변경', '비밀번호 변경'].map((item, i) => (
                <View key={item}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity style={styles.settingRow}>
                    <Text style={styles.settingLabel}>{item}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.dangerZone}>
              <TouchableOpacity>
                <Text style={styles.dangerText}>로그아웃</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 8 }}>
                <Text style={[styles.dangerText, { fontSize: 13 }]}>계정 삭제</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 데이터 내보내기 바텀시트 ── */}
      <Modal visible={showDataExport} transparent animationType="slide">
        <Pressable style={styles.overlayBottom} onPress={() => setShowDataExport(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>데이터 내보내기</Text>
            <Text style={styles.modalSub}>나의 걱정 기록을 파일로 저장해요</Text>

            <Text style={styles.fieldLabel}>기간 선택</Text>
            <View style={styles.periodRow}>
              {(['month', 'all'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, exportPeriod === p && styles.periodBtnActive]}
                  onPress={() => setExportPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      exportPeriod === p && styles.periodBtnTextActive,
                    ]}
                  >
                    {p === 'month' ? '이번 달' : '전체 기간'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 4 }]}>파일 형식</Text>
            <View style={styles.periodRow}>
              {(['pdf', 'csv', 'text'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.formatBtn, exportFormat === f && styles.formatBtnActive]}
                  onPress={() => setExportFormat(f)}
                >
                  <Text
                    style={[
                      styles.formatBtnText,
                      exportFormat === f && styles.formatBtnTextActive,
                    ]}
                  >
                    {f.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.exportPreview}>
              <Text style={styles.exportPreviewText}>
                {exportPeriod === 'month' ? '이번 달' : '전체 기간'} · 총 {worries.length}개 기록 · {exportFormat.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sheetSaveBtn}
              onPress={() => setShowDataExport(false)}
            >
              <Text style={styles.sheetSaveBtnText}>내보내기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  infoCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  settingsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  // ── 공통 모달 ──
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timePicker: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -8,
  },
  // 알림 시간 피커
  timePickerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timePickerCancel: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  timePickerSave: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  // 알림 시간 (web fallback)
  timeInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
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
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  // 맞춤 알림 문구
  messageList: {
    gap: 8,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  messageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#f9f7fc',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  customInputSection: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  sheetSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetSaveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // 계정 관리
  accountCard: {
    backgroundColor: '#f3f0f8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
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
  accountAvatarText: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 10,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  accountEmail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  editLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  accountList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  dangerZone: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
  },
  dangerText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '500',
  },
  // 데이터 내보내기
  periodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#ffffff',
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  formatBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#f9f7fc',
  },
  formatBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  formatBtnTextActive: {
    color: Colors.primary,
  },
  exportPreview: {
    backgroundColor: '#f3f0f8',
    borderRadius: 12,
    padding: 16,
  },
  exportPreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
