import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface Worry {
  id: string;
  text: string;
  topic: string;
  emotion: string;
  memo?: string;
  photoUri?: string;
  canChange?: boolean;
  createdAt: Date;
  recurring?: boolean;
  keywords?: string[];
}

interface WorryContextType {
  worries: Worry[];
  addWorry: (worry: Omit<Worry, 'id' | 'createdAt'>) => string;
  updateWorry: (id: string, updates: Partial<Worry>) => void;
  deleteWorry: (id: string) => void;
  getWorry: (id: string) => Worry | undefined;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
  customTopics: string[];
  customEmotions: string[];
  addCustomTopic: (topic: string) => void;
  addCustomEmotion: (emotion: string) => void;
  removedTopics: string[];
  removedEmotions: string[];
  removeTopicTag: (tag: string) => void;
  removeEmotionTag: (tag: string) => void;
  editTopicTag: (oldTag: string, newTag: string) => void;
  editEmotionTag: (oldTag: string, newTag: string) => void;
  loaded: boolean;
}

const WorryContext = createContext<WorryContextType | undefined>(undefined);

const STORAGE_KEY = 'wt_worries';
const NOTIF_ENABLED_KEY = 'wt_notif_enabled';
const NOTIF_TIME_KEY = 'wt_notif_time';
const CUSTOM_TOPICS_KEY = 'wt_custom_topics';
const CUSTOM_EMOTIONS_KEY = 'wt_custom_emotions';
const REMOVED_TOPICS_KEY = 'wt_removed_topics';
const REMOVED_EMOTIONS_KEY = 'wt_removed_emotions';

// 시연용 시드 데이터 스위치 — GitHub 배포 전 false 로 변경
// 프로덕션 빌드에서는 __DEV__ 가 자동으로 false 가 되어 빈 상태로 시작
const SEED_DATA_ENABLED = __DEV__;

const getSampleWorries = (): Worry[] => {
  if (!SEED_DATA_ENABLED) return [];
  return [
    // ── 4월 (10건) ──────────────────────────────────────────────
    {
      id: 'seed_01',
      text: '졸업 논문 주제를 아직 못 정했어요. 지도교수님께 어떻게 말씀드려야 할지 막막해요',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-04-01'),
      recurring: false,
    },
    {
      id: 'seed_02',
      text: '이번 학기 전공 수업이 너무 어려워서 따라가기가 버거워요',
      topic: '공부',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-04-03'),
      recurring: true,
    },
    {
      id: 'seed_03',
      text: '동기들은 인턴 합격 소식이 들려오는데 나만 서류에서 계속 탈락하는 것 같아요',
      topic: '진로·취업',
      emotion: '우울',
      canChange: true,
      createdAt: new Date('2026-04-06'),
      recurring: false,
    },
    {
      id: 'seed_04',
      text: '룸메이트랑 생활 패턴이 너무 달라서 사소한 마찰이 계속 생기고 있어요',
      topic: '관계',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-04-09'),
      recurring: false,
    },
    {
      id: 'seed_05',
      text: '자취 생활비가 생각보다 많이 나와서 부모님께 부담드리는 것 같아 미안해요',
      topic: '돈',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-04-12'),
      recurring: true,
    },
    {
      id: 'seed_06',
      text: '요즘 잠을 제대로 못 자고 있어요. 항상 피곤하고 수업 중에 집중도 안 돼요',
      topic: '건강',
      emotion: '무기력',
      canChange: false,
      createdAt: new Date('2026-04-15'),
      recurring: true,
    },
    {
      id: 'seed_07',
      text: '팀 프로젝트에서 내 역할을 제대로 못 하고 있는 것 같아서 팀원들한테 죄송해요',
      topic: '관계',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-04-18'),
      recurring: false,
    },
    {
      id: 'seed_08',
      text: '취업 준비를 어디서부터 시작해야 할지 모르겠어요. 방향이 전혀 안 잡혀요',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-04-21'),
      recurring: false,
    },
    {
      id: 'seed_09',
      text: '중간고사 준비를 충분히 못 한 것 같아요. 학점이 많이 걱정돼요',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-04-24'),
      recurring: false,
    },
    {
      id: 'seed_10',
      text: '가족들이 졸업 후 계획을 물어볼 때마다 뭐라고 대답해야 할지 모르겠어요',
      topic: '관계',
      emotion: '스트레스',
      canChange: false,
      createdAt: new Date('2026-04-27'),
      recurring: false,
    },
    // ── 5월 (15건) ──────────────────────────────────────────────
    {
      id: 'seed_11',
      text: '모바일 컴퓨팅 과제가 생각보다 훨씬 어렵네요. 발표 전날인데 아직 완성이 안 됐어요',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-01'),
      recurring: false,
      keywords: ['과제불안', '완성도', '발표압박'],
    },
    {
      id: 'seed_12',
      text: '졸업하면 취직이 바로 될지 불안해요. 취업 시장이 점점 어려워지는 것 같아요',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-05-04'),
      recurring: true,
    },
    {
      id: 'seed_13',
      text: '친한 친구가 요즘 연락이 뜸해요. 내가 뭔가 잘못한 건지 모르겠어요',
      topic: '관계',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-06'),
      recurring: false,
    },
    {
      id: 'seed_14',
      text: '중간고사 결과가 예상보다 좋지 않았어요. 기말에서 만회해야 한다는 압박이 너무 커요',
      topic: '공부',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-08'),
      recurring: false,
      keywords: ['성취압박', '학업불안'],
    },
    {
      id: 'seed_15',
      text: '자소서를 쓸 때마다 내 경험이 너무 부족한 것 같아서 자신감이 안 생겨요',
      topic: '진로·취업',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-05-10'),
      recurring: false,
    },
    {
      id: 'seed_16',
      text: '몸이 자꾸 안 좋은데 시간이 없어서 병원을 못 가고 있어요',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-12'),
      recurring: false,
    },
    {
      id: 'seed_17',
      text: '이번 달 카드값이 예상보다 훨씬 많이 나왔어요. 생활비를 어떻게 맞춰야 할지 모르겠어요',
      topic: '돈',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-05-14'),
      recurring: false,
      keywords: ['소비불안', '재정압박'],
    },
    {
      id: 'seed_18',
      text: '팀원이 작업을 자꾸 미루고 있는데 어떻게 말해야 할지 모르겠어요',
      topic: '관계',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-05-16'),
      recurring: false,
    },
    {
      id: 'seed_19',
      text: '대학원을 갈지 취업을 할지 아직도 결정을 못 했어요. 시간이 얼마 없는데',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-18'),
      recurring: true,
    },
    {
      id: 'seed_20',
      text: '졸업 작품 발표가 한 달도 안 남았는데 내 준비 수준이 충분한지 모르겠어요',
      topic: '공부',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-05-20'),
      recurring: false,
    },
    {
      id: 'seed_21',
      text: '부모님이 취직 얘기를 슬쩍 꺼내실 때마다 부담감이 커져요',
      topic: '관계',
      emotion: '스트레스',
      canChange: false,
      createdAt: new Date('2026-05-22'),
      recurring: false,
    },
    {
      id: 'seed_22',
      text: '요즘 밥을 잘 못 먹고 있어요. 식욕이 없고 체력도 많이 딸려요',
      topic: '건강',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-05-24'),
      recurring: false,
      keywords: ['건강소홀', '식욕저하'],
    },
    {
      id: 'seed_23',
      text: '시험 기간인데 도서관 자리를 맨날 못 잡아서 공부 환경이 마음에 안 들어요',
      topic: '공부',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-05-26'),
      recurring: false,
    },
    {
      id: 'seed_24',
      text: '알바를 구하고 싶은데 수업 일정이랑 겹쳐서 시간이 도저히 안 나요',
      topic: '돈',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-05-28'),
      recurring: false,
    },
    {
      id: 'seed_25',
      text: '좋아하는 사람이 생겼는데 어떻게 해야 할지 모르겠어요',
      topic: '관계',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-05-30'),
      recurring: false,
    },
    // ── 6월 (6건) ───────────────────────────────────────────────
    {
      id: 'seed_26',
      text: '기말고사가 2주 뒤인데 공부할 게 너무 많아서 어디서부터 시작해야 할지 모르겠어요',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-06-01'),
      recurring: false,
      keywords: ['시험불안', '과부하', '우선순위'],
    },
    {
      id: 'seed_27',
      text: '졸업 후 취직이 안 되면 어떡하나 밤마다 생각이 너무 많아져요',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-06-03'),
      recurring: true,
    },
    {
      id: 'seed_28',
      text: '요즘 두통이 자주 오는데 스트레스 때문인지 다른 이유인지 모르겠어요',
      topic: '건강',
      emotion: '스트레스',
      createdAt: new Date('2026-06-05'),
      recurring: false,
    },
    {
      id: 'seed_29',
      text: '오랜 친구랑 가치관 차이가 느껴져요. 관계가 점점 멀어지는 것 같아서 속상해요',
      topic: '관계',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-06-08'),
      recurring: false,
      keywords: ['관계변화', '소통단절'],
    },
    {
      id: 'seed_30',
      text: '졸업 전에 해외여행을 한 번 가고 싶은데 돈이 없어요',
      topic: '돈',
      emotion: '실망',
      createdAt: new Date('2026-06-10'),
      recurring: false,
    },
    {
      id: 'seed_31',
      text: '취업 포트폴리오를 완성해야 하는데 자꾸 미루게 돼요. 의지력이 부족한 것 같아요',
      topic: '진로·취업',
      emotion: '무기력',
      createdAt: new Date('2026-06-12'),
      recurring: false,
      keywords: ['미루기', '자기효능감', '동기부족'],
    },
  ];
};

export function WorryProvider({ children }: { children: ReactNode }) {
  const [worries, setWorries] = useState<Worry[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('23:00');
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [customEmotions, setCustomEmotions] = useState<string[]>([]);
  const [removedTopics, setRemovedTopics] = useState<string[]>([]);
  const [removedEmotions, setRemovedEmotions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 앱 시작 시 저장된 데이터 로드
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [storedWorries, storedNotifEnabled, storedNotifTime, storedTopics, storedEmotions, storedRemovedTopics, storedRemovedEmotions] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(NOTIF_ENABLED_KEY),
          AsyncStorage.getItem(NOTIF_TIME_KEY),
          AsyncStorage.getItem(CUSTOM_TOPICS_KEY),
          AsyncStorage.getItem(CUSTOM_EMOTIONS_KEY),
          AsyncStorage.getItem(REMOVED_TOPICS_KEY),
          AsyncStorage.getItem(REMOVED_EMOTIONS_KEY),
        ]);

        if (storedWorries) {
          const parsed = JSON.parse(storedWorries);
          setWorries(parsed.map((w: Worry & { createdAt: string }) => ({
            ...w,
            createdAt: new Date(w.createdAt),
          })));
        } else {
          setWorries(getSampleWorries());
        }

        if (storedNotifEnabled !== null) {
          setNotificationsEnabled(storedNotifEnabled === 'true');
        }
        if (storedNotifTime) {
          setNotificationTime(storedNotifTime);
        }
        if (storedTopics) setCustomTopics(JSON.parse(storedTopics));
        if (storedEmotions) setCustomEmotions(JSON.parse(storedEmotions));
        if (storedRemovedTopics) setRemovedTopics(JSON.parse(storedRemovedTopics));
        if (storedRemovedEmotions) setRemovedEmotions(JSON.parse(storedRemovedEmotions));
      } catch {
        setWorries(getSampleWorries());
      }
      setLoaded(true);
    };
    loadAll();
  }, []);

  // worries 변경 시 저장 (로드 완료 후에만)
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(worries));
    }
  }, [worries, loaded]);

  // 알림 설정 변경 시 저장
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(notificationsEnabled));
    }
  }, [notificationsEnabled, loaded]);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(NOTIF_TIME_KEY, notificationTime);
    }
  }, [notificationTime, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CUSTOM_TOPICS_KEY, JSON.stringify(customTopics));
  }, [customTopics, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CUSTOM_EMOTIONS_KEY, JSON.stringify(customEmotions));
  }, [customEmotions, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(REMOVED_TOPICS_KEY, JSON.stringify(removedTopics));
  }, [removedTopics, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(REMOVED_EMOTIONS_KEY, JSON.stringify(removedEmotions));
  }, [removedEmotions, loaded]);

  // 알림 켜기/끄기, 시간 변경 시 스케줄 동기화 (웹 제외)
  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;

    const syncNotifications = async () => {
      try {
        if (notificationsEnabled) {
          const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            if (canAskAgain) {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            } else {
              setNotificationsEnabled(false);
              Alert.alert(
                '알림 권한이 필요해요',
                '설정 앱 > Worry Teller > 알림에서 직접 허용해주세요.',
                [{ text: '확인' }]
              );
              return;
            }
          }

          if (finalStatus !== 'granted') {
            setNotificationsEnabled(false);
            return;
          }

          const [h, m] = notificationTime.split(':').map(Number);
          await Notifications.cancelAllScheduledNotificationsAsync();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Worry Teller ✦',
              body: '오늘 하루 어땠나요? 걱정을 기록해봐요',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: h,
              minute: m,
            },
          });
        } else {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      } catch {
        // 알림 스케줄링 실패 시 조용히 무시 (웹/시뮬레이터 등)
      }
    };

    syncNotifications();
  }, [notificationsEnabled, notificationTime, loaded]);

  const addCustomTopic = (topic: string) => {
    setCustomTopics(prev => prev.includes(topic) ? prev : [...prev, topic]);
  };

  const addCustomEmotion = (emotion: string) => {
    setCustomEmotions(prev => prev.includes(emotion) ? prev : [...prev, emotion]);
  };

  const removeTopicTag = (tag: string) => {
    if (customTopics.includes(tag)) {
      setCustomTopics(prev => prev.filter(t => t !== tag));
    } else {
      setRemovedTopics(prev => prev.includes(tag) ? prev : [...prev, tag]);
    }
  };

  const removeEmotionTag = (tag: string) => {
    if (customEmotions.includes(tag)) {
      setCustomEmotions(prev => prev.filter(e => e !== tag));
    } else {
      setRemovedEmotions(prev => prev.includes(tag) ? prev : [...prev, tag]);
    }
  };

  const editTopicTag = (oldTag: string, newTag: string) => {
    if (!newTag.trim() || newTag === oldTag) return;
    if (customTopics.includes(oldTag)) {
      setCustomTopics(prev => prev.map(t => t === oldTag ? newTag : t));
    } else {
      setRemovedTopics(prev => [...prev, oldTag]);
      setCustomTopics(prev => [...prev, newTag]);
    }
    setWorries(prev => prev.map(w => w.topic === oldTag ? { ...w, topic: newTag } : w));
  };

  const editEmotionTag = (oldTag: string, newTag: string) => {
    if (!newTag.trim() || newTag === oldTag) return;
    if (customEmotions.includes(oldTag)) {
      setCustomEmotions(prev => prev.map(e => e === oldTag ? newTag : e));
    } else {
      setRemovedEmotions(prev => [...prev, oldTag]);
      setCustomEmotions(prev => [...prev, newTag]);
    }
    setWorries(prev => prev.map(w => w.emotion === oldTag ? { ...w, emotion: newTag } : w));
  };

  const addWorry = (worry: Omit<Worry, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    setWorries(prev => [{ ...worry, id, createdAt: new Date() }, ...prev]);
    return id;
  };

  const updateWorry = (id: string, updates: Partial<Worry>) => {
    setWorries(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWorry = (id: string) => {
    setWorries(prev => prev.filter(w => w.id !== id));
  };

  const getWorry = (id: string) => worries.find(w => w.id === id);

  return (
    <WorryContext.Provider value={{
      worries, addWorry, updateWorry, deleteWorry, getWorry,
      notificationsEnabled, setNotificationsEnabled,
      notificationTime, setNotificationTime,
      customTopics, customEmotions, addCustomTopic, addCustomEmotion,
      removedTopics, removedEmotions, removeTopicTag, removeEmotionTag, editTopicTag, editEmotionTag,
      loaded,
    }}>
      {children}
    </WorryContext.Provider>
  );
}

export function useWorries() {
  const context = useContext(WorryContext);
  if (!context) throw new Error('useWorries must be used within WorryProvider');
  return context;
}
