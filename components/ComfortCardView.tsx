'use client';

import type { CardDesign, ComfortCard } from '@/lib/types';
import { designOf, formatCardDate } from '@/lib/cards';

interface Props {
  card: ComfortCard;
  /** 카드에 함께 표시할 선물 한마디(선택) */
  note?: string;
  /** 배경 디자인 고정(저장된 카드·선물 링크). 없으면 오늘 날짜 기준으로 배정 */
  design?: CardDesign | null;
  onClick?: () => void;
}

/** globals.css .card-message의 font-size(3.8cqw) × line-height(1.55) — 한 줄 높이(cqw) */
const MSG_LINE_H_CQW = 3.8 * 1.55;

/**
 * 위로 카드 뷰 — 원작 카드 아트를 배경으로 쓰고,
 * 하단 '오늘의 한마디' 박스 영역에 위로 문구를 오버레이한다.
 */
export default function ComfortCardView({ card, note, design: fixedDesign, onClick }: Props) {
  const design = designOf(card, { design: fixedDesign });
  const hasNote = !!note?.trim();

  // 문구는 위쪽 고정(top-anchor) — 첫 줄은 줄 수와 무관하게 늘 같은 자리.
  // 기준 위치는 예전 세로 중앙 정렬에서 1줄 문구가 놓이던 곳(중앙 + 카드 높이 0.5% 하향).
  const overlayHeightCqw = (design.textBottom - design.textTop) * design.aspect * 100;
  const msgTopCqw = (overlayHeightCqw - MSG_LINE_H_CQW) / 2 + design.aspect * 0.5;
  const overlayStyle: React.CSSProperties = {
    top: `${design.textTop * 100}%`,
    bottom: `${(1 - design.textBottom) * 100}%`,
    paddingTop: `${msgTopCqw}cqw`,
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
      {/* 아트의 리본 배너(원래 '오늘의 한마디' 자리)에 날짜를 얹는다 */}
      <div
        className="card-ribbon-date"
        style={{ top: `${design.ribbonY * 100}%`, color: design.ribbonInk }}
      >
        {formatCardDate()}
      </div>
      <div className="card-overlay" style={overlayStyle}>
        <div className="card-message" style={{ color: design.ink }}>
          “{card.message}”
        </div>
        {hasNote && (
          <div className="card-note" style={{ color: design.accent }}>
            {note?.trim()}
          </div>
        )}
      </div>
    </div>
  );
}
