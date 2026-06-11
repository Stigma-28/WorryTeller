import { Worry } from '@/context/WorryContext';

export function filterThisMonth(worries: Worry[]): Worry[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return worries.filter(w => w.createdAt >= start);
}

export function filterToday(worries: Worry[]): Worry[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return worries.filter(w => w.createdAt >= start);
}

function countBy(keys: string[]): Record<string, number> {
  return keys.reduce((acc, k) => {
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function topEntry(counts: Record<string, number>): [string, number] | null {
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0] ?? null;
}

// 이번 달 또는 오늘 기준 인사이트 문장 배열 (최대 3개)
export function generateInsights(worries: Worry[], scope: 'month' | 'today'): string[] {
  const label = scope === 'today' ? '오늘' : '이번 달';

  if (worries.length === 0) {
    return [
      scope === 'today'
        ? '오늘은 아직 걱정을 기록하지 않았어요. 마음이 편한 하루예요 ✦'
        : '이번 달 아직 기록이 없어요. 첫 걱정을 기록해봐요',
    ];
  }

  const insights: string[] = [];
  const topicCounts = countBy(worries.map(w => w.topic));
  const emotionCounts = countBy(worries.map(w => w.emotion));
  const topTopic = topEntry(topicCounts);
  const topEmotion = topEntry(emotionCounts);

  // 1. 주제·감정 패턴
  if (topTopic && topEmotion && topTopic[1] >= 2 && topEmotion[1] >= 2) {
    insights.push(
      `${label} ${topTopic[0]}·${topEmotion[0]} 패턴이 ${topTopic[1]}번 반복되고 있어요`
    );
  } else if (worries.length === 1) {
    insights.push(`${label} ${worries[0].topic} 관련 ${worries[0].emotion} 감정이 기록됐어요`);
  } else if (topTopic && topTopic[1] >= 2) {
    insights.push(`${label} ${topTopic[0]} 관련 걱정이 ${topTopic[1]}번으로 가장 많아요`);
  }

  // 2. 오늘: 복합 주제
  if (scope === 'today') {
    const topics = Object.keys(topicCounts);
    if (topics.length >= 2) {
      insights.push(`${topics.slice(0, 2).join('·')} 두 가지가 복합적으로 걱정되고 있어요`);
    }
  }

  // 3. 통제 가능 비율
  const classified = worries.filter(w => w.canChange !== undefined);
  if (classified.length >= 2) {
    const ratio = Math.round(
      (worries.filter(w => w.canChange === true).length / classified.length) * 100
    );
    if (ratio >= 60) {
      insights.push(`분류된 걱정의 ${ratio}%는 직접 바꿀 수 있는 것들이에요 💪`);
    } else if (ratio <= 35) {
      insights.push('받아들여야 할 것들도 있어요. 스스로를 너무 탓하지 마요 🤍');
    }
  }

  // 4. 반복 걱정 (이번 달만)
  if (scope === 'month') {
    const recurringCount = worries.filter(w => w.recurring).length;
    if (recurringCount >= 2) {
      insights.push(`같은 걱정이 ${recurringCount}번 반복되고 있어요. 패턴을 파악해봐요`);
    }
  }

  // 모든 조건 미충족 시 fallback
  if (insights.length === 0) {
    insights.push(
      scope === 'today'
        ? `오늘 ${worries.length}개의 걱정이 기록됐어요. 분류하면 더 많은 인사이트를 볼 수 있어요`
        : `이번 달 ${worries.length}개의 걱정이 기록됐어요. 패턴이 쌓이면 인사이트가 생겨요 ✦`
    );
  }

  return insights.slice(0, 3);
}

// WorryDetail 개별 걱정 인사이트
export function generateWorryInsight(worry: Worry, allWorries: Worry[]): string {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthWorries = allWorries.filter(w => w.createdAt >= monthStart);

  const sameTopicCount = monthWorries.filter(w => w.topic === worry.topic).length;
  const sameEmotionCount = monthWorries.filter(w => w.emotion === worry.emotion).length;
  const sameComboCount = monthWorries.filter(
    w => w.topic === worry.topic && w.emotion === worry.emotion
  ).length;

  const parts: string[] = [];

  if (sameComboCount >= 2) {
    parts.push(`이번 달 ${worry.topic}·${worry.emotion} 패턴이 ${sameComboCount}번 나타났어요.`);
  } else if (sameTopicCount >= 2) {
    parts.push(`이번 달 ${worry.topic} 관련 걱정이 ${sameTopicCount}번째예요.`);
  } else if (sameEmotionCount >= 2) {
    parts.push(`${worry.emotion} 감정은 이번 달 ${sameEmotionCount}번 기록됐어요.`);
  } else {
    parts.push(`이번 달 처음 기록된 ${worry.topic} 걱정이에요.`);
  }

  if (worry.canChange === true) {
    parts.push('바꿀 수 있는 걱정이에요. 매트릭스에서 할 일로 정리해봐요 ✦');
  } else if (worry.canChange === false) {
    parts.push('통제할 수 없는 것들은 받아들이는 것도 용기예요 🤍');
  } else {
    parts.push('분류하면 마음 정리에 더 도움이 돼요.');
  }

  return parts.join(' ');
}
