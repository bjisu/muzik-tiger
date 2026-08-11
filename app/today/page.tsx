'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComfortCardView from '@/components/ComfortCardView';
import { useToast } from '@/components/Toast';
import { pickTodayCard } from '@/lib/cards';
import { registerVisit, saveCard } from '@/lib/storage';
import { logEvent } from '@/lib/analytics';
import type { CardDesign, ComfortCard } from '@/lib/types';

/** C-01 오늘의 위로 — 하루 한 장, 저장·선물 (기획서 4) */
export default function TodayPage() {
  const router = useRouter();
  const [card, setCard] = useState<ComfortCard | null>(null);
  const [designKey, setDesignKey] = useState<CardDesign | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [toast, showToast] = useToast();

  useEffect(() => {
    const state = registerVisit();
    const { card: picked, design } = pickTodayCard();
    setCard(picked);
    setDesignKey(design);
    setSaved(state.savedCardIds.includes(picked.id));
    setSavedCount(state.savedCardIds.length);
    logEvent('card_view', { cardId: picked.id, category: picked.category });
  }, []);

  // 오늘의 디자인은 카드와 함께 뽑혀 seenToday에 저장된다 —
  // 같은 날 새로고침엔 그대로, 저장소를 비우고 다시 들어오면 카드·배경 모두 새로 뽑힌다
  if (!card || !designKey) return <main className="today-main" />;

  const onSave = () => {
    // 저장 시점의 디자인을 함께 기록해 컬렉션에서 그 모습 그대로 남긴다
    if (saveCard(card.id, designKey)) {
      setSaved(true);
      setSavedCount((n) => n + 1);
      logEvent('card_save', { cardId: card.id, category: card.category });
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
          <img src="/brand/logo.png" alt="MUZIK TIGER" className="header-logo" />
        </div>
        <Link href="/collection" className="top-link">
          내 카드 {savedCount > 0 ? `${savedCount}장` : '보기'}
        </Link>
      </header>

      <main className="today-main">
        <div className="today-title">
          <div className="caption">Daily Comfort</div>
          <h1>
            <span className="deco" aria-hidden>
              ·
            </span>
            오늘의 위로
            <span className="deco" aria-hidden>
              ·
            </span>
          </h1>
          <div className="rule" aria-hidden />
        </div>

        <div className="card-enter">
          <ComfortCardView card={card} design={designKey} />
        </div>

        <div className="btn-row">
          <button className={`btn ${saved ? 'btn-saved' : 'btn-ghost'}`} onClick={onSave}>
            {saved ? '카드함에 저장됨 ✓' : '내 카드함에 저장'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/gift/${card.id}?d=${designKey}`)}
          >
            공유하기
          </button>
        </div>

        <p className="today-hint">내일 또 새로운 위로가 도착해요 🧡</p>
      </main>
      {toast}
    </>
  );
}
