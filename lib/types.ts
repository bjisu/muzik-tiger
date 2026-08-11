export type ComfortCategory = 'cheer' | 'comfort' | 'encourage' | 'humor' | 'remind';

export type CardDesign = 'tradition' | 'forest' | 'beach' | 'home' | 'winter';

export type Timeslot = 'morning' | 'noon' | 'evening' | 'overtime';

export interface ComfortCard {
  id: string;
  message: string; // 위로 한마디 (원작 감수 완료본)
  category: ComfortCategory;
  weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 특정 요일 가중(선택) — 0=일 … 6=토
  timeslot?: Timeslot;
  design?: CardDesign; // 카드 배경 템플릿(선택, 없으면 자동 배정)
}

export interface UserComfortState {
  savedCardIds: string[];
  streakDays: number; // 연속 접속일
  lastVisitDate: string; // YYYY-MM-DD
  /** 오늘 뽑힌 카드 — design까지 함께 박아 하루 동안 배경도 그대로 유지한다 */
  seenToday?: { date: string; cardId: string; design?: CardDesign };
  recentCardIds: string[]; // 최근 노출 카드(재노출 방지)
  /** 저장 시점에 보였던 배경 디자인 — 나중에 날짜가 바뀌어도 그 모습 그대로 유지 */
  savedDesigns: Record<string, CardDesign>;
}

export interface AnalyticsEvent {
  ts: string;
  sessionId: string;
  goodsId?: string;
  batchId?: string;
  event: 'tag_open' | 'card_view' | 'card_save' | 'card_share' | 'gift_open' | 'gift_share';
  props?: Record<string, string | number>;
}
