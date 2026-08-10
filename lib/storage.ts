import type { CardDesign, UserComfortState } from './types';

const KEY = 'mzt_comfort_state_v1';

const DEFAULT_STATE: UserComfortState = {
  savedCardIds: [],
  streakDays: 0,
  lastVisitDate: '',
  recentCardIds: [],
  savedDesigns: {},
};

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getState(): UserComfortState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as UserComfortState) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function setState(state: UserComfortState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장 공간 부족 등은 조용히 무시 */
  }
}

/** 방문 기록 + 연속 접속(streak) 갱신. 갱신된 상태를 반환한다. */
export function registerVisit(): UserComfortState {
  const state = getState();
  const today = todayStr();
  if (state.lastVisitDate === today) return state;

  const yesterday = todayStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
  state.streakDays = state.lastVisitDate === yesterday ? state.streakDays + 1 : 1;
  state.lastVisitDate = today;
  setState(state);
  return state;
}

/**
 * 카드 저장(중복 방지). 새로 저장되었으면 true.
 * design을 함께 넘기면 저장 시점의 배경 디자인을 박아둔다(이후 날짜가 바뀌어도 그대로).
 */
export function saveCard(cardId: string, design?: CardDesign): boolean {
  const state = getState();
  if (state.savedCardIds.includes(cardId)) return false;
  state.savedCardIds = [cardId, ...state.savedCardIds]; // 최신순
  if (design) state.savedDesigns = { ...state.savedDesigns, [cardId]: design };
  setState(state);
  return true;
}

export function isCardSaved(cardId: string): boolean {
  return getState().savedCardIds.includes(cardId);
}

/** 저장 시점에 박아둔 디자인(없으면 undefined → 날짜 기준 배정) */
export function savedDesignOf(cardId: string): CardDesign | undefined {
  return getState().savedDesigns?.[cardId];
}
