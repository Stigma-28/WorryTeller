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
}

const WorryContext = createContext<WorryContextType | undefined>(undefined);

const STORAGE_KEY = 'wt_worries';
const NOTIF_ENABLED_KEY = 'wt_notif_enabled';
const NOTIF_TIME_KEY = 'wt_notif_time';
const CUSTOM_TOPICS_KEY = 'wt_custom_topics';
const CUSTOM_EMOTIONS_KEY = 'wt_custom_emotions';
const REMOVED_TOPICS_KEY = 'wt_removed_topics';
const REMOVED_EMOTIONS_KEY = 'wt_removed_emotions';

const getSampleWorries = (): Worry[] => {
  const now = new Date();
  return [
    {
      id: '1',
      text: '취업 준비가 막막하게 느껴져요',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      recurring: true,
    },
    {
      id: '2',
      text: '면접 준비를 충분히 했는지 모르겠어요',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '3',
      text: '요즘 취업 시장이 너무 어려운 것 같아요',
      topic: '진로·취업',
      emotion: '무기력',
      canChange: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '4',
      text: '친구가 나를 오해하는 것 같아서 속상해요',
      topic: '관계',
      emotion: '실망',
      canChange: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '5',
      text: '시험 성적이 잘 나올지 걱정돼요',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      recurring: true,
    },
    {
      id: '6',
      text: '부모님이 내 진로를 반대하실까봐 두려워요',
      topic: '관계',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '7',
      text: '체중이 계속 늘어나서 스트레스예요',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      recurring: true,
    },
    {
      id: '8',
      text: '용돈이 부족해서 하고 싶은 걸 못해요',
      topic: '돈',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '9',
      text: '발표할 때 실수할까봐 떨려요',
      topic: '공부',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '10',
      text: '잠이 잘 안 와서 피곤해요',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      recurring: true,
    },
    {
      id: '11',
      text: '주변 사람들과 비교하게 돼요',
      topic: '관계',
      emotion: '우울',
      canChange: false,
      createdAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
      recurring: false,
    },
    {
      id: '12',
      text: '계획한 대로 하루가 흘러가지 않아요',
      topic: '공부',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      recurring: false,
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
      if (notificationsEnabled) {
        const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          if (canAskAgain) {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          } else {
            // 영구 거부 — 시스템 설정으로 안내
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
