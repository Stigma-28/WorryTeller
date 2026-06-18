# Worry Teller 🔮

> 걱정을 기록하고, 분류하고, 시각화해서 내 걱정 패턴을 한눈에 파악하는 앱

Team 05 Big Os | Mobile Computing Final Project  
BeomJun Wei · JaeEun Lee · JiMin Lee

---

## Tech Stack

- **Expo** (React Native)
- **Figma** (UI/UX Design)
- **Google Gemini API 2.5 Flash-Lite** (AI keyword extraction & insight)

---

## Getting Started

### 1. Clone the repository

```bash
https://github.com/Stigma-28/WorryTeller.git
cd WorryTeller
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Gemini API Key

AI 기능(키워드 추출, 패턴 인사이트)을 사용하려면 Gemini API 키가 필요합니다.

**키 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com) 접속
2. 구글 계정으로 로그인
3. 좌측 또는 상단 **"Get API key"** 클릭
4. **"Create API key"** → 프로젝트 선택 후 생성
5. 발급된 키 복사 (`AIza...`로 시작)

**키 설정:**

프로젝트 루트(`WorryTeller/`)에 `.env` 파일을 새로 만들고 아래 내용 입력:

```
EXPO_PUBLIC_GEMINI_API_KEY=여기에_발급받은_키_붙여넣기
```

> `.env.example` 파일을 참고하세요.

### 4. Start the app

```bash
npx expo start
```

터미널에 QR 코드가 뜨면:
- **iOS**: 카메라 앱으로 QR 코드 스캔
- **Android**: Expo Go 앱으로 QR 코드 스캔
- **Web**: 터미널에서 `w` 키 입력

---

## Notes

- API 키 없이도 앱 실행은 가능하지만, AI 기능(걱정 들여다보기, 패턴 인사이트)은 동작하지 않습니다.
- Gemini API 무료 티어 기준 일일 호출 횟수 제한이 있습니다. 시연 직전에 키를 새로 발급받는 것을 권장합니다.
- `.env` 파일은 보안상 깃허브에 업로드되지 않습니다.
