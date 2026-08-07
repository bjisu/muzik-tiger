import type { UserComfortState } from './types';

const KEY = 'mzt_comfort_state_v1';

const DEFAULT_STATE: UserComfortState = {
  savedCardIds: [],
  streakDays: 0,
  lastVisitDate: '',
  recentCardIds: [],
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

/** 카드 저장(중복 방지). 새로 저장되었으면 true. */
export function saveCard(cardId: string): boolean {
  const state = getState();
  if (state.savedCardIds.includes(cardId)) return false;
  state.savedCardIds = [cardId, ...state.savedCardIds]; // 최신순
  setState(state);
  return true;
}

export function isCardSaved(cardId: string): boolean {
  return getState().savedCardIds.includes(cardId);
}
