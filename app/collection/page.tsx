'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComfortCardView from '@/components/ComfortCardView';
import { useToast } from '@/components/Toast';
import { cardById } from '@/lib/cards';
import { getState } from '@/lib/storage';
import { shareCardImage } from '@/lib/share';
import { logEvent } from '@/lib/analytics';
import type { ComfortCard } from '@/lib/types';

/** C-02 위로 카드 컬렉션 + C-02a 카드 상세 시트 (기획서 5) */
export default function CollectionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<ComfortCard[]>([]);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<ComfortCard | null>(null);
  const [sharing, setSharing] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    const state = getState();
    setCards(state.savedCardIds.map(cardById).filter(Boolean) as ComfortCard[]);
    setStreak(state.streakDays);
  }, []);

  const onShare = async (card: ComfortCard) => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareCardImage(card);
      logEvent('card_share', { cardId: card.id });
      if (result === 'downloaded') showToast('카드 이미지를 저장했어요!');
    } catch {
      showToast('공유에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <header className="top-bar">
        <Link href="/today" className="back-btn">
          ← 오늘의 위로
        </Link>
      </header>

      <main className="collection-main">
        <div className="top-title" style={{ justifyContent: 'center' }}>
          내 위로 카드
        </div>

        <div className="collection-stats">
          <span className="stat-chip">
            누적 <strong>{cards.length}장</strong>
          </span>
          {streak > 1 && (
            <span className="stat-chip streak">
              🔥 <strong>{streak}일 연속</strong>
            </span>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="collection-empty">
            아직 저장한 카드가 없어요.
            <br />
            오늘의 위로를 저장해 첫 카드를 모아보세요!
            <br />
            <Link href="/today" className="btn btn-primary">
              오늘의 위로 보러 가기
            </Link>
          </div>
        ) : (
          <div className="thumb-grid">
            {cards.map((c) => (
              <ComfortCardView key={c.id} card={c} showDate={false} onClick={() => setSelected(c)} />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="sheet-body" onClick={(e) => e.stopPropagation()}>
            <button className="sheet-close" onClick={() => setSelected(null)} aria-label="닫기">
              ×
            </button>
            <ComfortCardView card={selected} />
            <div className="btn-row" style={{ marginTop: 4 }}>
              <button className="btn btn-ghost" disabled={sharing} onClick={() => onShare(selected)}>
                {sharing ? '준비 중…' : '공유'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/gift/${selected.id}`)}
              >
                선물
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </>
  );
}
