'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CardDesign, ComfortCard } from '@/lib/types';
import { designOf, formatCardDate, messageLines } from '@/lib/cards';

interface Props {
  card: ComfortCard;
  /** 카드에 함께 표시할 선물 한마디(선택) */
  note?: string;
  /** 배경 디자인 고정(저장된 카드·선물 링크). 없으면 오늘 날짜 기준으로 배정 */
  design?: CardDesign | null;
  onClick?: () => void;
}

/** 측정 기준 폭 — 실제 카드 폭과 무관하게 비율만 맞으면 된다 */
const REF_W = 1000;
/** globals.css .card-line 의 font-size 3.8cqw 에 대응 */
const MSG_FONT_CQW = 3.8;

/** 가장 긴 줄이 카드 폭 80%를 넘으면 폰트 축소 배율(1 미만)을 계산 */
function measureScale(lines: string[]): number {
  if (typeof document === 'undefined') return 1;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return 1;
  ctx.font = `800 ${REF_W * (MSG_FONT_CQW / 100)}px 'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  return Math.min(1, (REF_W * 0.8) / widest);
}

/**
 * 위로 카드 뷰 — 원작 카드 아트를 배경으로 쓰고,
 * 문구·한마디를 아트의 점선(밑줄) 위에 글씨 쓰듯 얹는다.
 * 각 줄은 카드 전체 높이 기준 실측 좌표(line1/line2/noteY)에 절대 배치,
 * translateY(-100%)로 글자 아랫부분이 점선 바로 위에 닿는다.
 */
export default function ComfortCardView({ card, note, design: fixedDesign, onClick }: Props) {
  const design = designOf(card, { design: fixedDesign });
  const trimmedNote = note?.trim();

  // 분할은 글자 수 기반이라 SSR·클라이언트가 항상 같은 결과 — 하이드레이션 안전.
  // 폰트 축소 배율만 마운트 후 실측으로 갱신한다.
  const lines = useMemo(() => messageLines(card.message), [card.message]);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    setScale(measureScale(lines));
  }, [lines]);

  const lineTops = [design.line1, design.line2];

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
      {lines.slice(0, 2).map((line, i) => (
        <div
          key={i}
          className="card-line"
          style={{
            top: `${lineTops[i] * 100}%`,
            color: design.ink,
            fontSize: `${(MSG_FONT_CQW * scale).toFixed(2)}cqw`,
          }}
        >
          {line}
        </div>
      ))}
      {trimmedNote && (
        <div
          className="card-note"
          style={{ top: `${design.noteY * 100}%`, color: design.accent }}
        >
          {trimmedNote}
        </div>
      )}
    </div>
  );
}
