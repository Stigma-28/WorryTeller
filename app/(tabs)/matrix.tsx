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
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { useWorries } from '@/context/WorryContext';

const RESOLVED_IDS_KEY = 'wt_resolved_ids';
const TODOS_KEY = 'wt_todos';

interface TodoItem {
  id: string;
  text: string;
}

export default function Matrix() {
  const insets = useSafeAreaInsets();
  const { worries, updateWorry, deleteWorry } = useWorries();

  const canChangeWorries = worries.filter(w => w.canChange === true);
  const cannotChangeWorries = worries.filter(w => w.canChange === false);

  const getChipLabel = (worry: { keywords?: string[]; text: string }) =>
    worry.keywords && worry.keywords.length > 0
      ? worry.keywords.slice(0, 2).join(' · ')
      : worry.text;

  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [showAllCan, setShowAllCan] = useState(false);
  const [showAllCannot, setShowAllCannot] = useState(false);
  const [managingWorry, setManagingWorry] = useState<{ id: string; text: string } | null>(null);

  const INITIAL_SHOW = 5;
  const visibleCanChange = showAllCan ? canChangeWorries : canChangeWorries.slice(0, INITIAL_SHOW);
  const visibleCannotChange = showAllCannot ? cannotChangeWorries : cannotChangeWorries.slice(0, INITIAL_SHOW);

  useEffect(() => {
    const load = async () => {
      const [storedIds, storedTodos] = await Promise.all([
        AsyncStorage.getItem(RESOLVED_IDS_KEY),
        AsyncStorage.getItem(TODOS_KEY),
      ]);
      if (storedIds) setResolvedIds(new Set(JSON.parse(storedIds)));
      if (storedTodos) {
        const parsed = JSON.parse(storedTodos);
        // 기존 string[] 형식 마이그레이션
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          setTodos(parsed.map((text: string, i: number) => ({ id: String(i), text })));
        } else {
          setTodos(parsed);
        }
      } else {
        setTodos([
          { id: '1', text: '포트폴리오 정리' },
          { id: '2', text: '자기소개서 작성' },
          { id: '3', text: '모의 면접 준비' },
        ]);
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(RESOLVED_IDS_KEY, JSON.stringify([...resolvedIds]));
  }, [resolvedIds, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos, loaded]);

  const toggleResolved = (id: string) => {
    const next = new Set(resolvedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setResolvedIds(next);
  };

  const handleWorryManage = (worryId: string, worryText: string) => {
    setManagingWorry({ id: worryId, text: worryText });
  };

  const handleReclassifyManage = () => {
    if (!managingWorry) return;
    updateWorry(managingWorry.id, { canChange: undefined });
    setManagingWorry(null);
  };

  const handleDeleteManage = () => {
    if (!managingWorry) return;
    setResolvedIds(prev => {
      const next = new Set(prev);
      next.delete(managingWorry.id);
      return next;
    });
    deleteWorry(managingWorry.id);
    setManagingWorry(null);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim() }]);
    setNewTodoText('');
    setShowAddTodo(false);
  };

  const handleDeleteTodo = () => {
    if (deleteTargetId === null) return;
    setTodos(todos.filter(t => t.id !== deleteTargetId));
    setDeleteTargetId(null);
    setShowDeleteConfirm(false);
  };

  const renderTodoItem = ({ item, drag, isActive }: RenderItemParams<TodoItem>) => {
    const index = todos.findIndex(t => t.id === item.id);
    return (
    <ScaleDecorator>
      <View style={[styles.todoRow, index > 0 && styles.todoRowBorder, isActive && styles.todoRowActive]}>
        <TouchableOpacity onLongPress={drag} delayLongPress={100} hitSlop={8}>
          <Ionicons name="menu" size={16} color={isActive ? Colors.primary : '#d1d5db'} />
        </TouchableOpacity>
        <View style={styles.todoNumber}>
          <Text style={styles.todoNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.todoText}>{item.text}</Text>
        <TouchableOpacity
          onPress={() => {
            setDeleteTargetId(item.id);
            setShowDeleteConfirm(true);
          }}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
    );
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
                  ({canChangeWorries.filter(w => resolvedIds.has(w.id)).length}/{canChangeWorries.length} 해결)
                </Text>
              )}
            </View>
            {canChangeWorries.length > 0 ? (
              <View style={styles.chipWrap}>
                {visibleCanChange.map(worry => {
                  const resolved = resolvedIds.has(worry.id);
                  return (
                    <View key={worry.id} style={styles.chipRow}>
                      <TouchableOpacity
                        style={[styles.chip, resolved && styles.chipResolved]}
                        onPress={() => toggleResolved(worry.id)}
                        onLongPress={() => handleWorryManage(worry.id, worry.text)}
                        delayLongPress={500}
                      >
                        <Text style={[styles.chipText, resolved && styles.chipTextResolved]} numberOfLines={1}>
                          {getChipLabel(worry)}
                        </Text>
                        <View style={[styles.chipDot, resolved && styles.chipDotResolved]}>
                          {resolved && <Ionicons name="checkmark" size={9} color="#ffffff" />}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.chipMenuBtn}
                        onPress={() => handleWorryManage(worry.id, worry.text)}
                        hitSlop={8}
                      >
                        <Ionicons name="ellipsis-horizontal" size={14} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {canChangeWorries.length > INITIAL_SHOW && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllCan(prev => !prev)}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllCan ? '접기' : `나머지 ${canChangeWorries.length - INITIAL_SHOW}개 더 보기`}
                    </Text>
                  </TouchableOpacity>
                )}
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
                {visibleCannotChange.map(worry => (
                  <View key={worry.id} style={styles.chipRow}>
                    <TouchableOpacity
                      style={styles.chipStatic}
                      onLongPress={() => handleWorryManage(worry.id, worry.text)}
                      delayLongPress={500}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipStaticText} numberOfLines={1}>{getChipLabel(worry)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chipMenuBtn}
                      onPress={() => handleWorryManage(worry.id, worry.text)}
                      hitSlop={8}
                    >
                      <Ionicons name="ellipsis-horizontal" size={14} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ))}
                {cannotChangeWorries.length > INITIAL_SHOW && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllCannot(prev => !prev)}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllCannot ? '접기' : `나머지 ${cannotChangeWorries.length - INITIAL_SHOW}개 더 보기`}
                    </Text>
                  </TouchableOpacity>
                )}
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
              <View>
                <DraggableFlatList
                  data={todos}
                  keyExtractor={item => item.id}
                  onDragEnd={({ data }) => setTodos(data)}
                  renderItem={renderTodoItem}
                  scrollEnabled={false}
                  activationDistance={5}
                />
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

      {/* 걱정 관리 모달 */}
      <Modal visible={managingWorry !== null} transparent animationType="fade">
        <Pressable style={styles.overlayCenter} onPress={() => setManagingWorry(null)}>
          <Pressable style={styles.deleteModal} onPress={() => {}}>
            <Text style={styles.deleteTitle}>걱정 관리</Text>
            <Text style={styles.deleteSub} numberOfLines={1}>{managingWorry?.text}</Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleReclassifyManage}>
                <Text style={styles.cancelBtnText}>분류 해제</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleDeleteManage}>
                <Text style={styles.deleteConfirmBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setManagingWorry(null)} style={styles.manageCancel}>
              <Text style={styles.manageCancelText}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 할 일 삭제 확인 모달 */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <Pressable
          style={styles.overlayCenter}
          onPress={() => {
            setShowDeleteConfirm(false);
            setDeleteTargetId(null);
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
                  setDeleteTargetId(null);
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
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  chipMenuBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 190,
  },
  chipResolved: {
    backgroundColor: '#f0f0f0',
  },
  chipText: {
    fontSize: 12,
    color: Colors.canChangeText,
    flexShrink: 1,
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
    maxWidth: 190,
  },
  chipStaticText: {
    fontSize: 12,
    color: '#374151',
    flexShrink: 1,
  },
  showMoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 12,
    color: Colors.textMuted,
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
  todoRowActive: {
    backgroundColor: Colors.background,
    borderRadius: 12,
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
  manageCancel: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  manageCancelText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
