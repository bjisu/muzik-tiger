import rawCards from '@/data/comfort-cards.json';
import type { CardDesign, ComfortCard, Timeslot } from './types';
import { getState, setState, todayStr } from './storage';

export const CARDS: ComfortCard[] = rawCards as ComfortCard[];

const RECENT_WINDOW = 7; // 최근 N장 재노출 방지

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
  accent: string; // 포인트 색(받는 사람 한마디)
  ribbonY: number; // 아트의 리본 배너 중심(카드 높이 대비) — 날짜를 여기에 얹는다
  ribbonInk: string; // 리본 위 날짜 글자색
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
    ribbonY: 0.7969,
    ribbonInk: '#5B4023',
  },
  forest: {
    key: 'forest',
    label: '숲속 피크닉',
    src: '/cards/forest.webp',
    textTop: 0.845,
    textBottom: 0.96,
    ink: '#4A3524',
    accent: '#F18400',
    ribbonY: 0.8163,
    ribbonInk: '#FFFFFF',
  },
  beach: {
    key: 'beach',
    label: '여름 바닷가',
    src: '/cards/beach.webp',
    textTop: 0.812,
    textBottom: 0.92,
    ink: '#33566B',
    accent: '#3D8FB5',
    ribbonY: 0.7761,
    ribbonInk: '#FFFFFF',
  },
  home: {
    key: 'home',
    label: '포근한 집',
    src: '/cards/home.webp',
    textTop: 0.838,
    textBottom: 0.958,
    ink: '#6B4526',
    accent: '#C0762C',
    ribbonY: 0.7855,
    ribbonInk: '#FFFFFF',
  },
  winter: {
    key: 'winter',
    label: '겨울 눈놀이',
    src: '/cards/winter.webp',
    textTop: 0.812,
    textBottom: 0.944,
    ink: '#3D6076',
    accent: '#4E8FB0',
    ribbonY: 0.7999,
    ribbonInk: '#FFFFFF',
  },
};

const DESIGN_KEYS: CardDesign[] = ['tradition', 'forest', 'beach', 'home', 'winter'];

export function isCardDesign(v: unknown): v is CardDesign {
  return typeof v === 'string' && (DESIGN_KEYS as string[]).includes(v);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 디자인 결정 옵션 */
export interface DesignOpts {
  /** 저장된 카드·선물 링크로 고정된 디자인(있으면 날짜 배정보다 우선) */
  design?: CardDesign | null;
  /** 날짜 배정 기준일(YYYY-MM-DD). 기본값은 오늘 */
  date?: string;
}

/**
 * 카드 배경 디자인 결정 (우선순위)
 * 1) 카드 데이터에 design이 박혀 있으면 그대로 — 랜덤 배정 대상 아님
 * 2) 고정된 디자인(저장 시점 기록 / 선물 링크의 ?d=)이 있으면 그것
 * 3) 없으면 '날짜 + 카드 id' 시드의 결정적 난수 — 같은 날엔 항상 같고, 날짜가 바뀌면 달라진다
 */
export function designKeyOf(card: ComfortCard, opts?: DesignOpts): CardDesign {
  if (card.design) return card.design;
  if (isCardDesign(opts?.design)) return opts!.design as CardDesign;

  const rand = seededRandom(`design:${opts?.date ?? todayStr()}:${card.id}`);
  // 비슷한 시드(날짜 하루 차이 등)끼리 출력이 붙어 분포가 쏠리므로 초기 값 몇 개는 버린다
  for (let i = 0; i < 3; i++) rand();
  return DESIGN_KEYS[Math.floor(rand() * DESIGN_KEYS.length) % DESIGN_KEYS.length];
}

export function designOf(card: ComfortCard, opts?: DesignOpts): DesignSpec {
  return DESIGNS[designKeyOf(card, opts)];
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

/** 요일·시간대가 지정된 카드는 오늘과 맞아떨어질 때만 후보가 된다(지정이 없으면 항상 후보) */
function fitsNow(card: ComfortCard, weekday: number, slot: Timeslot): boolean {
  if (card.weekday !== undefined && card.weekday !== weekday) return false;
  if (card.timeslot !== undefined && card.timeslot !== slot) return false;
  return true;
}

/**
 * "오늘의 위로" 선택 로직 (기획서 4.1)
 * 1) 요일 + 시간대 계산  2) 오늘 이미 본 카드가 있으면 재노출
 * 3) 없으면 요일·시간대 하드 필터 → 최근 미노출 → 가중치로 1장 선정 후 seenToday 저장
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

  // 요일/시간대가 안 맞는 카드는 아예 제외 — 금요일에 월요일 문구가 나오지 않게
  const eligible = CARDS.filter((c) => fitsNow(c, weekday, slot));
  const generic = CARDS.filter((c) => c.weekday === undefined && c.timeslot === undefined);

  let pool = eligible.filter((c) => !recent.has(c.id));
  if (pool.length === 0) pool = eligible; // 최근 노출 조건만 완화
  if (pool.length === 0) pool = generic; // 그래도 없으면 지정 없는 일반 카드 전체
  if (pool.length === 0) pool = CARDS; // 최후 방어

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
