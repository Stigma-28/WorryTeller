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
  photoUris?: string[];
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
  customNotifMessages: string[];
  addCustomNotifMessage: (msg: string) => void;
  removeCustomNotifMessage: (msg: string) => void;
  editCustomNotifMessage: (oldMsg: string, newMsg: string) => void;
}

const WorryContext = createContext<WorryContextType | undefined>(undefined);

const STORAGE_KEY = 'wt_worries';
const NOTIF_ENABLED_KEY = 'wt_notif_enabled';
const NOTIF_TIME_KEY = 'wt_notif_time';
const CUSTOM_TOPICS_KEY = 'wt_custom_topics';
const CUSTOM_EMOTIONS_KEY = 'wt_custom_emotions';
const REMOVED_TOPICS_KEY = 'wt_removed_topics';
const REMOVED_EMOTIONS_KEY = 'wt_removed_emotions';
const CUSTOM_NOTIF_MESSAGES_KEY = 'wt_custom_notif_messages';

// 시연용 시드 데이터 스위치 — GitHub 배포 전 false 로 변경
// 프로덕션 빌드에서는 __DEV__ 가 자동으로 false 가 되어 빈 상태로 시작
const SEED_DATA_ENABLED = __DEV__;

const getSampleWorries = (): Worry[] => {
  if (!SEED_DATA_ENABLED) return [];
  return [
    // ── 4월 (15건) ──────────────────────────────────────────────
    {
      id: 'seed_01',
      text: '논문 주제를 아직도 못 정했는데 다음 주에 지도 교수님 면담이야. 뭐라고 말씀드려야 하지... 너무 막막하다',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-04-01'),
      recurring: false,
    },
    {
      id: 'seed_02',
      text: '이번 학기 전공 수업이 생각보다 훨씬 어렵다. 교수님 설명도 잘 이해가 안 되고 수업 따라가는 게 진짜 버거워',
      topic: '공부',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-04-03'),
      recurring: true,
    },
    {
      id: 'seed_03',
      text: '동기들은 인턴 붙었다는 얘기가 들려오는데 나는 서류에서 또 탈락했어. 나만 뒤처지는 것 같아서 진짜 속상하다',
      topic: '진로·취업',
      emotion: '우울',
      canChange: true,
      createdAt: new Date('2026-04-05'),
      recurring: false,
    },
    {
      id: 'seed_04',
      text: '룸메이트랑 생활 패턴이 너무 달라. 자는 시간도 다르고 청소 기준도 달라서 사소한 마찰이 자꾸 생기는데 어떻게 말을 꺼내야 할지 모르겠어',
      topic: '관계',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-04-07'),
      recurring: false,
    },
    {
      id: 'seed_05',
      text: '자취 생활비가 생각보다 너무 많이 나와. 부모님한테 자꾸 손 벌리는 것 같아서 미안하고 눈치도 보이고',
      topic: '돈',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-04-09'),
      recurring: true,
    },
    {
      id: 'seed_06',
      text: '요즘 밤에 잠이 잘 안 와. 억지로 눈 감아도 이런저런 생각이 계속 들고, 낮에는 항상 피곤하고 집중도 안 돼',
      topic: '건강',
      emotion: '무기력',
      canChange: false,
      createdAt: new Date('2026-04-11'),
      recurring: true,
    },
    {
      id: 'seed_07',
      text: '팀플에서 내 파트를 아직 다 못 했는데 팀원들한테 말을 못 하고 있어. 민폐 끼치는 것 같아서 너무 미안하다',
      topic: '관계',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-04-13'),
      recurring: false,
    },
    {
      id: 'seed_08',
      text: '취업 준비를 시작해야 한다는 건 아는데 어디서부터 뭘 해야 할지 모르겠어. 자격증? 포트폴리오? 다 막막하다',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-04-15'),
      recurring: false,
    },
    {
      id: 'seed_09',
      text: '중간고사가 다음 주인데 아직 한 과목도 제대로 정리를 못 했어. 이번엔 학점이 진짜 걱정된다',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-04-17'),
      recurring: false,
    },
    {
      id: 'seed_10',
      text: '가족들이 모이면 꼭 졸업 후 뭐 할 거냐고 물어봐. 아직 모르겠는데 그 질문이 올 때마다 너무 부담스러워',
      topic: '관계',
      emotion: '스트레스',
      canChange: false,
      createdAt: new Date('2026-04-19'),
      recurring: false,
    },
    {
      id: 'seed_11',
      text: '4학년인데 토익도 낮고 인턴 경험도 없어. 스펙이 너무 없는 것 같은데 이제 와서 뭘 할 수 있을지 모르겠다',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-04-21'),
      recurring: false,
      keywords: ['스펙불안', '취업준비', '늦은시작'],
    },
    {
      id: 'seed_12',
      text: '팀플에 진짜 아무것도 안 하는 팀원이 있어. 교수님한테 말하기도 뭐하고, 결국 내가 다 해야 할 것 같아서 억울하다',
      topic: '관계',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-04-23'),
      recurring: false,
    },
    {
      id: 'seed_13',
      text: '자취방 월세에 관리비까지 합치면 수입이 거의 없어. 부모님 지원만으로는 빠듯한데 알바 시간도 안 나고',
      topic: '돈',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-04-25'),
      recurring: true,
      keywords: ['월세부담', '생활비'],
    },
    {
      id: 'seed_14',
      text: '학기 초에 운동 시작하려고 했는데 어느새 4월 말이야. 몸이 점점 안 좋아지는 것 같은데 의욕이 도저히 안 나',
      topic: '건강',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-04-27'),
      recurring: false,
    },
    {
      id: 'seed_15',
      text: '동아리 후배들이랑 사이가 좀 어색해진 것 같아. 선배로서 잘 못 챙겨줬나 싶어서 마음이 계속 걸려',
      topic: '관계',
      emotion: '실망',
      canChange: true,
      createdAt: new Date('2026-04-29'),
      recurring: false,
    },
    // ── 5월 (18건) ──────────────────────────────────────────────
    {
      id: 'seed_16',
      text: '모바일 컴퓨팅 과제 발표가 내일인데 아직 완성을 못 했어. 밤새야 할 것 같아서 지금부터 너무 걱정된다',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-01'),
      recurring: false,
      keywords: ['발표압박', '기한임박', '과제불안'],
    },
    {
      id: 'seed_17',
      text: '졸업하고 나서 취직이 바로 될지 모르겠어. 요즘 취업 시장 너무 안 좋다는 얘기를 자꾸 들으니까 더 겁나',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-05-03'),
      recurring: true,
    },
    {
      id: 'seed_18',
      text: '친한 친구가 요즘 연락이 없어. 내가 뭔가 실수한 건지 그냥 바쁜 건지 모르겠어서 먼저 연락하기도 애매하다',
      topic: '관계',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-05'),
      recurring: false,
    },
    {
      id: 'seed_19',
      text: '중간고사 점수가 생각보다 많이 낮게 나왔어. 기말에서 만회해야 한다는 압박이 너무 크다',
      topic: '공부',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-07'),
      recurring: false,
      keywords: ['성적압박', '만회불안'],
    },
    {
      id: 'seed_20',
      text: '자소서 쓰려고 앉으면 쓸 게 없어. 인턴도 없고 대외활동도 별로 없고, 내 경험이 너무 평범한 것 같아',
      topic: '진로·취업',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-05-09'),
      recurring: false,
    },
    {
      id: 'seed_21',
      text: '요즘 몸이 자꾸 안 좋은데 시간이 없어서 병원을 못 가고 있어. 그냥 참고 있는데 더 나빠지는 건 아닌지 걱정돼',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-11'),
      recurring: false,
    },
    {
      id: 'seed_22',
      text: '이번 달 카드값이 생각보다 많이 나왔어. 다음 달 생활비를 어떻게 맞춰야 할지 막막하고 겁난다',
      topic: '돈',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-05-13'),
      recurring: false,
      keywords: ['소비불안', '재정압박'],
    },
    {
      id: 'seed_23',
      text: '팀플 팀원 중 한 명이 계속 자기 파트를 미루고 있어. 어떻게 말해야 할지 모르겠고, 결국 내가 다 할 것 같아',
      topic: '관계',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-05-15'),
      recurring: false,
    },
    {
      id: 'seed_24',
      text: '대학원을 갈지 취업을 할지 아직도 결정을 못 했어. 주변 친구들은 다 방향이 잡혀 있는 것 같은데 나만 흔들리는 것 같아',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-17'),
      recurring: true,
    },
    {
      id: 'seed_25',
      text: '졸업 작품 발표가 이제 한 달 남았어. 지금 상태로 발표해도 되는 건지 교수님한테 중간 점검을 받아야 할 것 같은데 무서워',
      topic: '공부',
      emotion: '두려움',
      canChange: true,
      createdAt: new Date('2026-05-19'),
      recurring: false,
    },
    {
      id: 'seed_26',
      text: '부모님이 슬슬 취직 얘기를 꺼내시는데 아직 확실한 방향도 없고 준비도 안 돼서 말씀드리기가 너무 부담스러워',
      topic: '관계',
      emotion: '스트레스',
      canChange: false,
      createdAt: new Date('2026-05-21'),
      recurring: false,
    },
    {
      id: 'seed_27',
      text: '요즘 밥을 잘 못 먹고 있어. 밥상 앞에 앉아도 입맛이 없고 몸에 기운도 없는 느낌이야',
      topic: '건강',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-05-23'),
      recurring: false,
      keywords: ['식욕저하', '무기력'],
    },
    {
      id: 'seed_28',
      text: '시험 기간인데 도서관 자리가 도저히 안 잡혀. 카페 가면 돈 나가고 집에서 하면 집중이 안 되고, 진짜 어디서 하라는 건지',
      topic: '공부',
      emotion: '짜증',
      canChange: true,
      createdAt: new Date('2026-05-25'),
      recurring: false,
    },
    {
      id: 'seed_29',
      text: '알바를 구하고 싶은데 수업이랑 과제가 너무 많아서 시간이 안 나. 돈은 필요한데 방법이 없어서 답답하다',
      topic: '돈',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-05-27'),
      recurring: false,
    },
    {
      id: 'seed_30',
      text: '좋아하는 사람이 생긴 것 같아. 꽤 친한 편인데 고백하면 어색해질까봐 망설여지고, 이 감정을 어떻게 해야 할지 모르겠어',
      topic: '관계',
      emotion: '부끄러움',
      canChange: true,
      createdAt: new Date('2026-05-29'),
      recurring: false,
    },
    {
      id: 'seed_31',
      text: '면접 준비를 하나도 못 했는데 서류가 붙어버렸어. 일주일 안에 준비해야 하는데 뭘 어떻게 해야 할지 모르겠다',
      topic: '진로·취업',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-05-30'),
      recurring: false,
      keywords: ['면접공포', '준비부족'],
    },
    {
      id: 'seed_32',
      text: '기말 과제가 세 과목이나 다 겹쳐. 어느 거 먼저 해야 할지 판단이 안 되고 그냥 멍하니 앉아 있는 시간이 더 많아',
      topic: '공부',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-31'),
      recurring: false,
      keywords: ['과부하', '우선순위'],
    },
    {
      id: 'seed_33',
      text: '커피를 너무 많이 마시고 있어. 안 마시면 졸리고, 마시면 밤에 잠을 못 자고. 이 악순환을 끊어야 하는데 못 하겠어',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-05-31'),
      recurring: false,
    },
    // ── 6월 (12건) ───────────────────────────────────────────────
    {
      id: 'seed_34',
      text: '친구들이 졸업 후 어디 갈 거냐고 물어봐. 다들 방향이 있는 것 같은데 나만 없는 것 같아서 그 대화가 너무 부담스러워',
      topic: '관계',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-06-01'),
      recurring: false,
    },
    {
      id: 'seed_35',
      text: '기말고사가 2주 뒤인데 범위가 너무 많아. 어디서부터 공부해야 할지 모르겠고 시간도 부족하고',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-06-01'),
      recurring: false,
      keywords: ['시험불안', '과부하', '우선순위'],
    },
    {
      id: 'seed_36',
      text: '졸업하고 취직이 안 되면 어떡하나 밤마다 생각해. 뚜렷한 대책도 없고 그냥 불안하기만 해',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-06-03'),
      recurring: true,
    },
    {
      id: 'seed_37',
      text: '요즘 두통이 자주 와. 스트레스 때문인지 수면 부족 때문인지 모르겠는데 진통제로 버티고 있어',
      topic: '건강',
      emotion: '스트레스',
      canChange: true,
      createdAt: new Date('2026-06-05'),
      recurring: false,
    },
    {
      id: 'seed_38',
      text: '오래된 친구랑 요즘 가치관 차이가 느껴져. 예전이랑 달라진 것 같은데 이걸 어떻게 받아들여야 할지 모르겠어',
      topic: '관계',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-06-07'),
      recurring: false,
      keywords: ['관계변화', '가치관차이'],
    },
    {
      id: 'seed_39',
      text: '졸업 전에 여행 한 번 가고 싶은데 돈이 없어. 취직 전에 제일 여유 있을 때가 지금인 것 같아서 더 아쉽다',
      topic: '돈',
      emotion: '실망',
      canChange: false,
      createdAt: new Date('2026-06-09'),
      recurring: false,
    },
    {
      id: 'seed_40',
      text: '취업 포트폴리오를 완성해야 하는데 자꾸 딴 것부터 하게 돼. 의지 문제인 건지 방향이 안 잡혀서 그런 건지 모르겠어',
      topic: '진로·취업',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-06-11'),
      recurring: false,
      keywords: ['미루기', '동기부족', '자기효능감'],
    },
    {
      id: 'seed_41',
      text: '졸업 학점을 계산해봤는데 장학금 기준에 딱 걸려. 기말 한 과목만 망해도 떨어질 것 같아서 마음이 너무 불안해',
      topic: '공부',
      emotion: '불안',
      canChange: true,
      createdAt: new Date('2026-06-11'),
      recurring: false,
    },
    {
      id: 'seed_42',
      text: '이력서에 공백이 생길 것 같아. 졸업 후 바로 취직이 안 되면 그 기간을 어떻게 설명해야 하나 벌써부터 걱정돼',
      topic: '진로·취업',
      emotion: '두려움',
      canChange: false,
      createdAt: new Date('2026-06-12'),
      recurring: false,
    },
    {
      id: 'seed_43',
      text: '취업하고 나면 지금 친한 친구들이랑 자연스럽게 멀어질까봐 걱정돼. 각자 회사 생활 시작하면 예전만큼 못 만날 것 같아서',
      topic: '관계',
      emotion: '불안',
      canChange: false,
      createdAt: new Date('2026-06-13'),
      recurring: false,
    },
    {
      id: 'seed_44',
      text: '요즘 머리가 항상 멍한 느낌이야. 집중하려고 해도 생각이 잘 안 정리돼. 번아웃인 건지 그냥 피곤한 건지 모르겠어',
      topic: '건강',
      emotion: '무기력',
      canChange: true,
      createdAt: new Date('2026-06-13'),
      recurring: false,
      keywords: ['번아웃', '집중력저하'],
    },
    {
      id: 'seed_45',
      text: '취직 전까지 생활비를 어떻게 버텨야 할지 막막해. 부모님한테 또 부탁드려야 할 것 같아서 마음이 무거워',
      topic: '돈',
      emotion: '스트레스',
      canChange: false,
      createdAt: new Date('2026-06-14'),
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
  const [customNotifMessages, setCustomNotifMessages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 앱 시작 시 저장된 데이터 로드
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [storedWorries, storedNotifEnabled, storedNotifTime, storedTopics, storedEmotions, storedRemovedTopics, storedRemovedEmotions, storedNotifMsgs] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(NOTIF_ENABLED_KEY),
          AsyncStorage.getItem(NOTIF_TIME_KEY),
          AsyncStorage.getItem(CUSTOM_TOPICS_KEY),
          AsyncStorage.getItem(CUSTOM_EMOTIONS_KEY),
          AsyncStorage.getItem(REMOVED_TOPICS_KEY),
          AsyncStorage.getItem(REMOVED_EMOTIONS_KEY),
          AsyncStorage.getItem(CUSTOM_NOTIF_MESSAGES_KEY),
        ]);

        if (storedWorries) {
          const parsed = JSON.parse(storedWorries);
          const userWorries = parsed
            .filter((w: any) => !w.id.startsWith('seed_'))
            .map((w: any) => {
              const { photoUri, ...rest } = w;
              return {
                ...rest,
                photoUris: rest.photoUris ?? (photoUri ? [photoUri] : undefined),
                createdAt: new Date(rest.createdAt),
              };
            });
          setWorries([...getSampleWorries(), ...userWorries]);
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
        if (storedNotifMsgs) setCustomNotifMessages(JSON.parse(storedNotifMsgs));
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

  const addCustomNotifMessage = (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    setCustomNotifMessages(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const removeCustomNotifMessage = (msg: string) => {
    setCustomNotifMessages(prev => prev.filter(m => m !== msg));
  };

  const editCustomNotifMessage = (oldMsg: string, newMsg: string) => {
    const trimmed = newMsg.trim();
    if (!trimmed) return;
    setCustomNotifMessages(prev => prev.map(m => m === oldMsg ? trimmed : m));
  };

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CUSTOM_NOTIF_MESSAGES_KEY, JSON.stringify(customNotifMessages));
  }, [customNotifMessages, loaded]);

  return (
    <WorryContext.Provider value={{
      worries, addWorry, updateWorry, deleteWorry, getWorry,
      notificationsEnabled, setNotificationsEnabled,
      notificationTime, setNotificationTime,
      customTopics, customEmotions, addCustomTopic, addCustomEmotion,
      removedTopics, removedEmotions, removeTopicTag, removeEmotionTag, editTopicTag, editEmotionTag,
      loaded, customNotifMessages, addCustomNotifMessage, removeCustomNotifMessage, editCustomNotifMessage,
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
