const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface InsightInput {
  period: 'month' | 'today';
  totalCount: number;
  topicCounts: Record<string, number>;
  emotionCounts: Record<string, number>;
  canChangeCount: number;
  cannotChangeCount: number;
}

// 세션 내 캐시 — 데이터가 바뀌지 않으면 API 재호출 없이 재사용
let cachedHash: string | null = null;
let cachedInsight: string | null = null;

function hashInput(input: InsightInput): string {
  return JSON.stringify(input);
}

export async function generateInsight(input: InsightInput): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  if (input.totalCount === 0) return null;

  const hash = hashInput(input);
  if (hash === cachedHash && cachedInsight !== null) return cachedInsight;

  const periodLabel = input.period === 'month' ? '이번 달' : '오늘';

  const topicSummary = Object.entries(input.topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([t, c]) => `${t}(${c}건)`)
    .join(', ');

  const emotionSummary = Object.entries(input.emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([e, c]) => `${e}(${c}건)`)
    .join(', ');

  const prompt = `${periodLabel} 걱정 데이터를 보고, 공감적인 심리 인사이트를 2~3문장으로 써줘.

[데이터]
- 총 걱정 수: ${input.totalCount}건
- 주제별: ${topicSummary}
- 감정별: ${emotionSummary}
- 통제 가능: ${input.canChangeCount}건, 통제 불가: ${input.cannotChangeCount}건, 미분류: ${input.totalCount - input.canChangeCount - input.cannotChangeCount}건

[규칙]
- 데이터에서 구체적인 패턴을 짚어줘 (가장 많은 주제·감정 언급)
- 부드럽고 공감적인 어조 (심리 상담사처럼)
- 마지막 문장은 가벼운 위로 또는 행동 제안
- 2~3문장, 120자 이내, 존댓말

[출력] JSON 형식으로만, 다른 텍스트 없이:
{"insight": "..."}`;

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

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.log('[Insight] HTTP', response.status, errBody);
      return null;
    }

    const data = await response.json();
    const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.log('[Insight] 응답 파싱 실패:', JSON.stringify(data));
      return null;
    }

    const parsed = JSON.parse(raw);
    const insight = typeof parsed.insight === 'string' ? parsed.insight.trim() : null;
    if (!insight) return null;

    cachedHash = hash;
    cachedInsight = insight;
    return insight;
  } catch (e) {
    clearTimeout(timeoutId);
    console.log('[Insight] catch:', e);
    return null;
  }
}
