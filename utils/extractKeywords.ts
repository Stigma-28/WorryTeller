const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface KeywordResult {
  keywords: string[];
  category: string;
  emotion: string;
}

export async function extractKeywords(
  text: string,
  activeTopics: string[],
  activeEmotions: string[],
): Promise<KeywordResult | null> {
  if (!text.trim()) return null;
  if (!GEMINI_API_KEY) return null;
  if (activeTopics.length === 0 || activeEmotions.length === 0) return null;

  const prompt = `아래 걱정 텍스트를 분석해서 핵심 키워드 2~3개, 카테고리, 감정을 추출해줘.

걱정 텍스트: "${text.trim()}"

[키워드 규칙]
- 텍스트에 나온 단어를 그대로 쓰지 마
- 걱정의 본질적인 개념을 담은 단어로 추출 (심리·상황적 핵심 개념)
- 예시: "발표가 잘 될지 모르겠다" → ["발표불안", "자기효능감", "평가부담"]
- 예시: "친구가 나를 오해하는 것 같다" → ["관계갈등", "소통불안", "오해"]
- 한국어로 2~3개

[카테고리 규칙]
반드시 아래 중 가장 적합한 것 하나만 선택:
${activeTopics.join(', ')}

[감정 규칙]
반드시 아래 중 가장 적합한 것 하나만 선택:
${activeEmotions.join(', ')}

[출력] 아래 JSON 형식으로만 응답, 다른 텍스트 없이:
{"keywords": ["키워드1", "키워드2"], "category": "카테고리명", "emotion": "감정명"}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    const keywords: string[] = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: unknown) => typeof k === 'string').slice(0, 3)
      : [];

    const category = typeof parsed.category === 'string' ? parsed.category.trim() : null;
    const emotion = typeof parsed.emotion === 'string' ? parsed.emotion.trim() : null;

    if (keywords.length === 0) return null;
    if (!category || !activeTopics.includes(category)) return null;
    if (!emotion || !activeEmotions.includes(emotion)) return null;

    return { keywords, category, emotion };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
