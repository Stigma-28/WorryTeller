# Worry Teller — 개발 기준 문서

디자인 레퍼런스: `../Worry Teller App Design_v25/` (읽기 전용, 절대 수정 금지)
구현 대상: 이 폴더(`WorryTeller/`) — Expo 54 + expo-router 6

---

## 1. 튜토리얼 잔재 파일 (정리 대상)

현재 `app/` 폴더에 Expo 튜토리얼 실습 코드가 남아 있다. Worry Teller 코드 작업 전에 정리가 필요하다.

| 파일/폴더 | 이유 |
|-----------|------|
| `app/(tabs)/about.tsx` | 튜토리얼 About 탭, 앱에 불필요 |
| `app/(tabs)/index.tsx` | 튜토리얼 ImageViewer+Button 코드, 전면 교체 필요 |
| `app/(tabs)/_layout.tsx` | 튜토리얼 탭 구성, 전면 교체 필요 |
| `components/Button.tsx` | 튜토리얼용 버튼 컴포넌트 |
| `components/ImageViewer.tsx` | 튜토리얼용 이미지 뷰어 |
| `assets/images/background-image.png` | 튜토리얼용 예제 이미지 |

`app-example/` 폴더는 Expo가 원본 보존용으로 자동 생성한 것이므로 건드리지 않아도 된다.

---

## 2. 전체 화면 구조 및 흐름

### 화면 목록 (디자인 레퍼런스 routes.tsx 기준)

| 경로 | 화면 | 역할 |
|------|------|------|
| `/` | Splash | 앱 시작, 시작하기 버튼 → Home |
| `/onboarding` | Onboarding | 알림 설정 후 시작 → Home |
| `/home` | Home | 이번달 기록 요약 + 최근 걱정 목록 (탭1) |
| `/log` | QuickLog | 걱정 입력 (텍스트 + 주제 + 감정 선택) |
| `/control/:worryId` | ControlBranch | 저장 직후 — "바꿀 수 있음/없음" 분기 선택 |
| `/matrix` | ControlMatrix | 통제 매트릭스 + 우선순위 할 일 목록 (탭2) |
| `/worry/:worryId` | WorryDetail | 걱정 상세 보기, 재분류, 삭제 |
| `/dashboard` | Dashboard | 카테고리별 빈도, 키워드 클라우드, 패턴 요약 (탭3) |
| `/category-detail` | CategoryDetail | 카테고리 빈도 바 차트 상세 |
| `/keyword-detail` | KeywordDetail | 키워드 클라우드 상세 + 감정 분포 |
| `/settings` | Settings | 알림 설정, 계정 관리, 데이터 내보내기 (탭4) |

### 핵심 사용자 흐름

```
Splash ──▶ Home
              │
              ├─[+ 버튼]──▶ QuickLog ──[저장]──▶ ControlBranch ──▶ ControlMatrix
              │
              ├─[걱정 클릭]──▶ WorryDetail
              │
[탭] Dashboard ──▶ CategoryDetail
                └──▶ KeywordDetail
```

### Expo Router 화면 구성 계획

```
app/
├── _layout.tsx              ← Stack (루트)
├── index.tsx                ← Splash
├── onboarding.tsx
├── (tabs)/
│   ├── _layout.tsx          ← Tabs (하단 탭 4개)
│   ├── home.tsx
│   ├── matrix.tsx
│   ├── dashboard.tsx
│   └── settings.tsx
├── log.tsx
├── control/
│   └── [worryId].tsx
├── worry/
│   └── [worryId].tsx
├── category-detail.tsx
└── keyword-detail.tsx
```

---

## 3. 핵심 디자인 토큰

> `theme.css`는 shadcn/ui 기본 토큰 파일이며 Worry Teller 전용 값이 아니다.
> 실제 앱 색상은 각 컴포넌트에 직접 하드코딩되어 있다. 아래 값을 기준으로 사용한다.

### 색상

```ts
// 앱 색상 상수 (constants/colors.ts 에 정의 예정)
export const Colors = {
  primary:       '#6C5A8E',   // 보라 — 헤더, 버튼, 강조
  primaryDark:   '#5a4976',   // 보라 어둡게 — 버튼 hover
  primaryLight:  '#8b7aa8',   // 보라 밝게 — 그라디언트 끝
  primaryMuted:  '#D4C4E8',   // 보라 연하게 — 안내 배경
  background:    '#EDE6F5',   // 앱 전체 배경 (연보라)
  card:          '#FFFFFF',   // 카드 배경
  textPrimary:   '#1F2937',   // 주요 텍스트 (gray-800)
  textSecondary: '#374151',   // 일반 텍스트 (gray-700)
  textMuted:     '#6B7280',   // 보조 텍스트 (gray-500)
  topicTag:      '#EDE6F5',   // 주제 태그 배경
  topicTagText:  '#6C5A8E',   // 주제 태그 텍스트
  emotionTag:    '#FFF7ED',   // 감정 태그 배경 (orange-50)
  emotionTagText:'#EA580C',   // 감정 태그 텍스트 (orange-600)
  canChange:     '#E1F5EE',   // 바꿀 수 있음 배경
  canChangeText: '#0F6E56',   // 바꿀 수 있음 텍스트
  cannotChange:  '#FAEEDA',   // 바꿀 수 없음 배경
  danger:        '#FF6B6B',   // 삭제/오류
};
```

### 폰트 크기

| 용도 | 크기 |
|------|------|
| 화면 제목 (h1) | 24 |
| 섹션 제목 (h2) | 20 |
| 본문 | 16 |
| 작은 텍스트 | 14 |
| 태그/레이블 | 12 |

### 간격 & 라운딩 (Tailwind → RN 변환)

| Tailwind | RN 값 |
|----------|-------|
| `p-6` | padding: 24 |
| `p-4` | padding: 16 |
| `gap-2` | gap: 8 |
| `gap-3` | gap: 12 |
| `rounded-2xl` | borderRadius: 16 |
| `rounded-full` | borderRadius: 9999 |
| `rounded-b-3xl` | borderBottomLeftRadius: 24, borderBottomRightRadius: 24 |

---

## 4. 웹→RN 변환 난이도 및 추천 순서

### 변환 시 공통 주의사항

| 웹 | React Native |
|----|-------------|
| `div` | `View` |
| `p`, `span`, `h1` | `Text` |
| `button` | `TouchableOpacity` 또는 `Pressable` |
| `textarea`, `input` | `TextInput` |
| `overflow-y-auto` | `ScrollView` |
| `className="..."` | `style={styles.xxx}` + `StyleSheet.create` |
| `useNavigate()` | `useRouter()` (expo-router) |
| `useParams()` | `useLocalSearchParams()` (expo-router) |
| `navigate('/path')` | `router.push('/path')` |
| `navigate(-1)` | `router.back()` |
| `localStorage` | `AsyncStorage` (@react-native-async-storage/async-storage) |
| `lucide-react` 아이콘 | `@expo/vector-icons` (Ionicons 등) |
| CSS 모달 (`absolute inset-0`) | `Modal` 컴포넌트 (react-native) |
| `input type="time"` | 직접 구현 또는 DateTimePicker |
| CSS 그라디언트 | `expo-linear-gradient` |
| `hover:` 스타일 | 없음 (Pressable의 `pressed` state로 대체) |

### 화면별 난이도

| 난이도 | 화면 | 이유 |
|--------|------|------|
| 쉬움 | Splash | 단순 레이아웃, 버튼, 텍스트만 |
| 쉬움 | ControlBranch | 카드 2개 선택지, 단순 state |
| 보통 | Onboarding | Switch 토글 + 시간 입력 (DateTimePicker 필요) |
| 보통 | Home | ScrollView + 카드 목록 + FAB |
| 보통 | QuickLog | TextInput + 칩 선택 UI |
| 보통 | WorryDetail | ScrollView + 삭제 확인 Modal |
| 보통 | Dashboard | ScrollView + 인라인 바 차트 (View로 구현 가능) |
| 어려움 | Settings | Bottom Sheet 스타일 Modal 4개, 시간 선택 UI |
| 어려움 | ControlMatrix | Modal 2개 + 복잡한 state + 드래그(미구현 가능) |
| 어려움 | CategoryDetail | 직접 구현 바 차트 (absolute 레이아웃 → RN 재설계) |
| 어려움 | KeywordDetail | 동적 폰트 크기 키워드 클라우드 |

### 추천 구현 순서

```
1단계 — 기반
  └─ 데이터 모델 + WorryContext (localStorage → AsyncStorage)
  └─ 색상/상수 파일 (constants/colors.ts)

2단계 — 단순 화면
  └─ Splash → Onboarding

3단계 — 핵심 흐름
  └─ Home → QuickLog → ControlBranch

4단계 — 탭 화면
  └─ Dashboard → Settings

5단계 — 상세 화면
  └─ WorryDetail → ControlMatrix → CategoryDetail → KeywordDetail
```
