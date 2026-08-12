import rawCards from '@/data/comfort-cards.json';
import type { CardDesign, ComfortCard, Timeslot } from './types';
import { getState, setState, todayStr } from './storage';

export const CARDS: ComfortCard[] = rawCards as ComfortCard[];

const RECENT_WINDOW = 7; // 최근 N장 재노출 방지

/**
 * 카드 배경 템플릿 정보 — 문구는 아트의 점선(밑줄) 위에 글씨를 쓰는 방식.
 * line1/line2/noteY는 각 점선의 y좌표(카드 전체 높이 대비 비율, 실측값).
 * 글자 아랫부분이 이 좌표에 닿도록 배치한다.
 */
export interface DesignSpec {
  key: CardDesign;
  label: string;
  src: string; // 화면·캔버스 렌더용(최적화본)
  line1: number; // 점선 1 — 문구 첫 줄이 올라앉는 자리
  line2: number; // 점선 2 — 문구 둘째 줄 자리
  noteY: number; // 받는 사람 한마디 자리
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
    // 전달받은 실측값(0.810/0.857/0.928)은 리본 배너와 겹침 — 아트 픽셀 스캔값으로 보정
    line1: 0.878,
    line2: 0.931,
    noteY: 0.968,
    ink: '#5B4023',
    accent: '#B0713A',
    ribbonY: 0.7969,
    ribbonInk: '#5B4023',
  },
  forest: {
    key: 'forest',
    label: '숲속 피크닉',
    src: '/cards/forest.webp',
    line1: 0.905,
    line2: 0.955,
    noteY: 0.974,
    ink: '#4A3524',
    accent: '#F18400',
    ribbonY: 0.8163,
    ribbonInk: '#FFFFFF',
  },
  beach: {
    key: 'beach',
    label: '여름 바닷가',
    src: '/cards/beach.webp',
    // line1 실측값(0.815)은 박스 상단 테두리 근처라 점선(0.877)으로 보정. 나머지는 전달값 유지
    line1: 0.877,
    line2: 0.92,
    noteY: 0.966,
    ink: '#33566B',
    accent: '#3D8FB5',
    ribbonY: 0.7761,
    ribbonInk: '#FFFFFF',
  },
  home: {
    key: 'home',
    label: '포근한 집',
    src: '/cards/home.webp',
    // 아트 픽셀 스캔 실측(대시 밴드 중심) — 실물 확인 후 필요하면 보정
    line1: 0.876,
    line2: 0.926,
    noteY: 0.962,
    ink: '#6B4526',
    accent: '#C0762C',
    ribbonY: 0.7855,
    ribbonInk: '#FFFFFF',
  },
  winter: {
    key: 'winter',
    label: '겨울 눈놀이',
    src: '/cards/winter.webp',
    // 아트 픽셀 스캔 실측(대시 밴드 중심) — 실물 확인 후 필요하면 보정
    line1: 0.89,
    line2: 0.944,
    noteY: 0.966,
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

/** 한 줄에 허용하는 최대 글자 수(공백 포함, 따옴표 제외) */
export const MAX_LINE_CHARS = 15;

/**
 * 위로 문구를 따옴표 포함 최대 2줄로 분할 — 화면·공유 이미지 공용.
 * 15자를 넘으면 중간에서 가장 가까운 공백에서 나눈다.
 */
export function messageLines(message: string): string[] {
  let parts = [message];
  if (message.length > MAX_LINE_CHARS) {
    const mid = message.length / 2;
    let split = -1;
    for (let i = 0; i < message.length; i++) {
      if (message[i] === ' ' && (split < 0 || Math.abs(i - mid) < Math.abs(split - mid))) split = i;
    }
    if (split > 0) parts = [message.slice(0, split), message.slice(split + 1)];
  }
  return parts.map(
    (p, i) => (i === 0 ? '“' : '') + p + (i === parts.length - 1 ? '”' : ''),
  );
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

/** 오늘 노출할 카드와 그 배경 */
export interface TodayPick {
  card: ComfortCard;
  design: CardDesign;
}

/**
 * "오늘의 위로" 선택 로직 (기획서 4.1)
 * 1) 요일 + 시간대 계산
 * 2) 오늘 뽑아둔 카드가 있으면 배경까지 그대로 재노출 — 카드는 자정에만 바뀐다
 * 3) 없으면 요일·시간대 하드 필터 → 최근 미노출 → 가중치로 1장 선정,
 *    배경도 함께 뽑아 seenToday에 박아둔다
 */
export function pickTodayCard(now = new Date()): TodayPick {
  const state = getState();
  const today = todayStr(now);
  const slot = timeslotOf(now.getHours());
  const weekday = now.getDay();

  // 날짜만 보고 재노출한다. 시간대가 바뀌었다고 카드를 다시 뽑으면
  // 하루에도 여러 번 카드가 바뀐다(오전에 본 카드가 저녁에 교체됨).
  // 날짜가 다르면 애초에 이 분기를 타지 않으므로, 예전 카드가 요일 필터를
  // 우회해 계속 나오는 문제(월요일에 "금요일이다!")도 그대로 막힌다.
  if (state.seenToday?.date === today) {
    const seen = cardById(state.seenToday.cardId);
    if (seen) {
      const kept = state.seenToday.design;
      if (isCardDesign(kept)) return { card: seen, design: kept };
      // 배경 기록 이전 버전의 상태 — 지금 한 번 뽑아 박아둔다
      const design = pickDesign(seen);
      state.seenToday = { date: today, cardId: seen.id, design };
      setState(state);
      return { card: seen, design };
    }
  }

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

  // 날짜 시드가 아니라 실제 난수 — 캐시를 지우고 다시 들어오면 다른 카드가 나온다.
  // 같은 브라우저에서 하루 한 장 고정은 seenToday(로컬 저장)가 담당한다.
  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  let r = Math.random() * total;
  let picked = weighted[weighted.length - 1].card;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) {
      picked = x.card;
      break;
    }
  }

  const design = pickDesign(picked);
  state.seenToday = { date: today, cardId: picked.id, design };
  state.recentCardIds = [picked.id, ...state.recentCardIds.filter((id) => id !== picked.id)].slice(
    0,
    RECENT_WINDOW,
  );
  setState(state);
  return { card: picked, design };
}

/** 오늘 노출용 배경 뽑기 — 카드에 디자인이 박혀 있으면 그것, 아니면 실제 난수 */
function pickDesign(card: ComfortCard): CardDesign {
  if (card.design) return card.design;
  return DESIGN_KEYS[Math.floor(Math.random() * DESIGN_KEYS.length) % DESIGN_KEYS.length];
}

/** 카드에 찍히는 날짜 — yy.mm.dd */
export function formatCardDate(d = new Date()): string {
  const y = String(d.getFullYear() % 100).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
