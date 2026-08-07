import type { AnalyticsEvent } from './types';

const EVENTS_KEY = 'mzt_comfort_events_v1';
const SESSION_KEY = 'mzt_comfort_session';
const NFC_KEY = 'mzt_comfort_nfc';
const MAX_EVENTS = 500;

function sessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** NFC 진입 파라미터(/t?g=&c=&b=)를 세션에 보관 */
export function rememberNfcParams(goodsId: string | null, batchId: string | null): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(NFC_KEY, JSON.stringify({ goodsId, batchId }));
}

function nfcParams(): { goodsId?: string; batchId?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(NFC_KEY);
    if (!raw) return {};
    const { goodsId, batchId } = JSON.parse(raw);
    return { goodsId: goodsId ?? undefined, batchId: batchId ?? undefined };
  } catch {
    return {};
  }
}

/**
 * 이벤트 로깅 — 현재는 로컬(localStorage)에만 쌓는다.
 * 추후 수집 서버가 생기면 이 함수에서 fetch로 전송하면 된다.
 */
export function logEvent(event: AnalyticsEvent['event'], props?: AnalyticsEvent['props']): void {
  if (typeof window === 'undefined') return;
  const entry: AnalyticsEvent = {
    ts: new Date().toISOString(),
    sessionId: sessionId(),
    ...nfcParams(),
    event,
    props,
  };
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    const list: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(-MAX_EVENTS)));
  } catch {
    /* ignore */
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', entry.event, entry.props ?? '');
  }
}
