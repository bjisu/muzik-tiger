'use client';

import type { ComfortCard } from '@/lib/types';
import { designOf, formatCardDate } from '@/lib/cards';

interface Props {
  card: ComfortCard;
  /** 카드에 함께 표시할 선물 한마디(선택) */
  note?: string;
  /** 날짜 표시 여부 (기본 true) */
  showDate?: boolean;
  onClick?: () => void;
}

/**
 * 위로 카드 뷰 — 원작 카드 아트를 배경으로 쓰고,
 * 하단 '오늘의 한마디' 박스 영역에 위로 문구를 오버레이한다.
 */
export default function ComfortCardView({ card, note, showDate = true, onClick }: Props) {
  const design = designOf(card);
  const hasNote = !!note?.trim();
  // 선물 한마디가 있으면 공간 확보를 위해 날짜를 숨긴다(배너와 겹침 방지)
  const displayDate = showDate && !hasNote;
  const overlayStyle: React.CSSProperties = {
    top: `${design.textTop * 100}%`,
    bottom: `${(1 - design.textBottom) * 100}%`,
  };

  return (
    <div
      className="card-frame"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={card.message}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={design.src} alt={`무직타이거 ${design.label} 카드`} className="card-bg" />
      <div className="card-overlay" style={overlayStyle}>
        {displayDate && (
          <div className="card-date" style={{ color: design.accent }}>
            {formatCardDate()}
          </div>
        )}
        <div className="card-message" style={{ color: design.ink }}>
          “{card.message}”
        </div>
        {hasNote && (
          <div className="card-note" style={{ color: design.accent }}>
            ♥ {note?.trim()}
          </div>
        )}
      </div>
    </div>
  );
}
