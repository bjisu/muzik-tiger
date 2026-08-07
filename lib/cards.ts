import rawCards from '@/data/comfort-cards.json';
import type { CardDesign, ComfortCard, Timeslot } from './types';
import { getState, setState, todayStr } from './storage';

export const CARDS: ComfortCard[] = rawCards as ComfortCard[];

const RECENT_WINDOW = 7; // 최근 N장 재노출 방지

export const WEEKDAY_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export const CATEGORY_KO: Record<ComfortCard['category'], string> = {
  cheer: '응원',
  comfort: '위로',
  encourage: '격려',
  humor: '유머',
  remind: '리마인드',
};

/** 카드 배경 템플릿 정보 — 텍스트 영역 위치는 원본 아트의 '오늘의 한마디' 박스 기준 */
export interface DesignSpec {
  key: CardDesign;
  label: string;
  src: string; // 화면·캔버스 렌더용(최적화본)
  textTop: number; // 카드 높이 대비 텍스트 영역 시작(비율)
  textBottom: number; // 텍스트 영역 끝(비율)
  ink: string; // 문구 색
  accent: string; // 날짜·포인트 색
}

export const DESIGNS: Record<CardDesign, DesignSpec> = {
  tradition: {
    key: 'tradition',
    label: '한국의 전통',
    src: '/cards/tradition.webp',
    textTop: 0.835,
    textBottom: 0.96,
    ink: '#5B4023',
    accent: '#B0713A',
  },
  forest: {
    key: 'forest',
    label: '숲속 피크닉',
    src: '/cards/forest.webp',
    textTop: 0.845,
    textBottom: 0.96,
    ink: '#4A3524',
    accent: '#F18400',
  },
  beach: {
    key: 'beach',
    label: '여름 바닷가',
    src: '/cards/beach.webp',
    textTop: 0.812,
    textBottom: 0.92,
    ink: '#33566B',
    accent: '#3D8FB5',
  },
};

const DESIGN_KEYS: CardDesign[] = ['tradition', 'forest', 'beach'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 카드에 지정된 디자인이 없으면 id 기준으로 고정 배정(항상 같은 디자인) */
export function designOf(card: ComfortCard): DesignSpec {
  const key = card.design ?? DESIGN_KEYS[hashStr(card.id) % DESIGN_KEYS.length];
  return DESIGNS[key];
}

export function cardById(id: string): ComfortCard | undefined {
  return CARDS.find((c) => c.id === id);
}

export function timeslotOf(hour: number): Timeslot {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'overtime';
}

/** 날짜 문자열 기반 결정적 난수(같은 날 = 같은 결과) */
function seededRandom(seed: string): () => number {
  let s = hashStr(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/**
 * "오늘의 위로" 선택 로직 (기획서 4.1)
 * 1) 요일 + 시간대 계산  2) 오늘 이미 본 카드가 있으면 재노출
 * 3) 없으면 가중치 + 최근 미노출 조건으로 1장 선정 후 seenToday 저장
 */
export function pickTodayCard(now = new Date()): ComfortCard {
  const state = getState();
  const today = todayStr(now);

  if (state.seenToday?.date === today) {
    const seen = cardById(state.seenToday.cardId);
    if (seen) return seen;
  }

  const slot = timeslotOf(now.getHours());
  const weekday = now.getDay();
  const recent = new Set(state.recentCardIds.slice(0, RECENT_WINDOW));

  let pool = CARDS.filter((c) => !recent.has(c.id));
  if (pool.length === 0) pool = CARDS;

  const weighted = pool.map((c) => {
    let w = 1;
    if (c.timeslot === slot) w += 2;
    if (c.weekday === weekday) w += 2;
    return { card: c, w };
  });

  const rand = seededRandom(today + ':' + slot);
  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  let r = rand() * total;
  let picked = weighted[weighted.length - 1].card;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) {
      picked = x.card;
      break;
    }
  }

  state.seenToday = { date: today, cardId: picked.id };
  state.recentCardIds = [picked.id, ...state.recentCardIds.filter((id) => id !== picked.id)].slice(
    0,
    RECENT_WINDOW,
  );
  setState(state);
  return picked;
}

/** 카드에 찍히는 날짜 — yy.mm.dd */
export function formatCardDate(d = new Date()): string {
  const y = String(d.getFullYear() % 100).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
