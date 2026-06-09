import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

function chipLabel(text: string) {
  return text.length > 14 ? text.slice(0, 13) + '…' : text;
}

export default function Matrix() {
  const insets = useSafeAreaInsets();
  const { worries } = useWorries();

  const canChangeWorries = worries.filter(w => w.canChange === true);
  const cannotChangeWorries = worries.filter(w => w.canChange === false);

  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [todos, setTodos] = useState(['포트폴리오 정리', '자기소개서 작성', '모의 면접 준비']);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [newTodoText, setNewTodoText] = useState('');

  const toggleResolved = (id: string) => {
    const next = new Set(resolvedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setResolvedIds(next);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    setTodos([...todos, newTodoText.trim()]);
    setNewTodoText('');
    setShowAddTodo(false);
  };

  const handleDeleteTodo = () => {
    if (deleteTargetIndex === null) return;
    setTodos(todos.filter((_, i) => i !== deleteTargetIndex));
    setDeleteTargetIndex(null);
    setShowDeleteConfirm(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <Text style={styles.headerTitle}>통제 매트릭스 ✦</Text>
        </View>

        <View style={styles.body}>
          {/* 바꿀 수 있음 */}
          <View style={styles.canChangeBox}>
            <View style={styles.boxTitleRow}>
              <Text style={styles.canChangeTitle}>바꿀 수 있음</Text>
              {canChangeWorries.length > 0 && (
                <Text style={styles.resolvedCounter}>
                  ({resolvedIds.size}/{canChangeWorries.length} 해결)
                </Text>
              )}
            </View>
            {canChangeWorries.length > 0 ? (
              <View style={styles.chipWrap}>
                {canChangeWorries.map(worry => {
                  const resolved = resolvedIds.has(worry.id);
                  return (
                    <TouchableOpacity
                      key={worry.id}
                      style={[styles.chip, resolved && styles.chipResolved]}
                      onPress={() => toggleResolved(worry.id)}
                    >
                      <Text style={[styles.chipText, resolved && styles.chipTextResolved]}>
                        {chipLabel(worry.text)}
                      </Text>
                      <View style={[styles.chipDot, resolved && styles.chipDotResolved]}>
                        {resolved && (
                          <Ionicons name="checkmark" size={9} color="#ffffff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyChipText}>
                ControlBranch에서 "바꿀 수 있어요"를 선택하면 여기 표시돼요
              </Text>
            )}
          </View>

          {/* 바꿀 수 없음 */}
          <View style={styles.cannotChangeBox}>
            <Text style={styles.cannotChangeTitle}>바꿀 수 없음</Text>
            {cannotChangeWorries.length > 0 ? (
              <View style={styles.chipWrap}>
                {cannotChangeWorries.map(worry => (
                  <View key={worry.id} style={styles.chipStatic}>
                    <Text style={styles.chipStaticText}>{chipLabel(worry.text)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyChipText}>
                ControlBranch에서 "바꿀 수 없어요"를 선택하면 여기 표시돼요
              </Text>
            )}
          </View>

          {/* 우선순위 할 일 */}
          <View style={styles.todoCard}>
            <View style={styles.todoHeader}>
              <Text style={styles.todoTitle}>우선순위 할 일</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddTodo(true)}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {todos.length === 0 ? (
              <Text style={styles.emptyChipText}>할 일을 추가해보세요</Text>
            ) : (
              <View style={styles.todoList}>
                {todos.map((todo, index) => (
                  <View key={index} style={[styles.todoRow, index > 0 && styles.todoRowBorder]}>
                    <Ionicons name="menu" size={16} color="#d1d5db" />
                    <View style={styles.todoNumber}>
                      <Text style={styles.todoNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.todoText}>{todo}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setDeleteTargetIndex(index);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 할 일 추가 바텀시트 */}
      <Modal visible={showAddTodo} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.overlayBottom} onPress={() => setShowAddTodo(false)}>
            <Pressable style={styles.bottomSheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>할 일 추가</Text>
              <TextInput
                value={newTodoText}
                onChangeText={setNewTodoText}
                placeholder="할 일을 입력해요..."
                placeholderTextColor="#9ca3af"
                style={styles.todoInput}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.sheetSaveBtn, !newTodoText.trim() && styles.sheetSaveBtnDisabled]}
                onPress={handleAddTodo}
                disabled={!newTodoText.trim()}
              >
                <Text style={styles.sheetSaveBtnText}>추가하기</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* 할 일 삭제 확인 모달 */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <Pressable
          style={styles.overlayCenter}
          onPress={() => {
            setShowDeleteConfirm(false);
            setDeleteTargetIndex(null);
          }}
        >
          <Pressable style={styles.deleteModal} onPress={() => {}}>
            <Text style={styles.deleteTitle}>할 일을 삭제할까요?</Text>
            <Text style={styles.deleteSub}>삭제한 항목은 복구할 수 없어요</Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetIndex(null);
                }}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleDeleteTodo}>
                <Text style={styles.deleteConfirmBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
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
  // 바꿀 수 있음
  canChangeBox: {
    backgroundColor: Colors.canChange,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canChangeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#14532d',
  },
  resolvedCounter: {
    fontSize: 11,
    color: '#6b7280',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chipResolved: {
    backgroundColor: '#f0f0f0',
  },
  chipText: {
    fontSize: 12,
    color: Colors.canChangeText,
  },
  chipTextResolved: {
    color: '#aaaaaa',
    textDecorationLine: 'line-through',
  },
  chipDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#9fe1cb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDotResolved: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  // 바꿀 수 없음
  cannotChangeBox: {
    backgroundColor: Colors.cannotChange,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cannotChangeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#78350f',
  },
  chipStatic: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chipStaticText: {
    fontSize: 12,
    color: '#374151',
  },
  emptyChipText: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
  // 할 일 카드
  todoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoList: {
    gap: 0,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  todoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  todoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  todoNumberText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 모달 공통
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  todoInput: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sheetSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetSaveBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  sheetSaveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 8,
  },
  deleteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  deleteSub: {
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
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
