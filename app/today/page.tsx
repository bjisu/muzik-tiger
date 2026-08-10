'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComfortCardView from '@/components/ComfortCardView';
import { useToast } from '@/components/Toast';
import { CATEGORY_KO, designKeyOf, pickTodayCard } from '@/lib/cards';
import { registerVisit, saveCard } from '@/lib/storage';
import { logEvent } from '@/lib/analytics';
import type { ComfortCard } from '@/lib/types';

/** C-01 오늘의 위로 — 하루 한 장, 저장·선물 (기획서 4) */
export default function TodayPage() {
  const router = useRouter();
  const [card, setCard] = useState<ComfortCard | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [toast, showToast] = useToast();

  useEffect(() => {
    const state = registerVisit();
    const picked = pickTodayCard();
    setCard(picked);
    setSaved(state.savedCardIds.includes(picked.id));
    setSavedCount(state.savedCardIds.length);
    logEvent('card_view', { cardId: picked.id, category: picked.category });
  }, []);

  if (!card) return <main className="today-main" />;

  // 오늘의 디자인 — 날짜+카드 id 시드라 같은 날엔 새로고침해도 그대로
  const designKey = designKeyOf(card);

  const onSave = () => {
    // 저장 시점의 디자인을 함께 기록해 컬렉션에서 그 모습 그대로 남긴다
    if (saveCard(card.id, designKey)) {
      setSaved(true);
      setSavedCount((n) => n + 1);
      logEvent('card_save', { cardId: card.id, category: card.category });
      showToast('컬렉션에 저장했어요!');
    } else {
      setSaved(true);
      showToast('이미 저장된 카드예요.');
    }
  };

  return (
    <>
      <header className="top-bar">
        <div className="top-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="MUZIK TIGER" />
          오늘의 위로
        </div>
        <Link href="/collection" className="top-link">
          내 카드 {savedCount > 0 ? `${savedCount}장` : '보기'}
        </Link>
      </header>

      <main className="today-main">
        <div className="today-badge">
          오늘의 {CATEGORY_KO[card.category]} 한마디
        </div>

        <ComfortCardView card={card} design={designKey} />

        <div className="btn-row">
          <button className={`btn ${saved ? 'btn-saved' : 'btn-ghost'}`} onClick={onSave}>
            {saved ? '저장됨 ✓' : '저장'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/gift/${card.id}?d=${designKey}`)}
          >
            선물하기
          </button>
        </div>

        <p className="today-hint">내일 또 새로운 한마디가 도착해요 🧡</p>
      </main>
      {toast}
    </>
  );
}
