import type { CardDesign, ComfortCard } from './types';
import { designOf, formatCardDate, messageLines } from './cards';

/** 캔버스에 카드 이미지(배경 템플릿 + 문구 + 선물 한마디)를 렌더링해 Blob으로 반환 */
export async function renderCardImage(
  card: ComfortCard,
  opts?: { note?: string; design?: CardDesign | null },
): Promise<Blob> {
  const design = designOf(card, { design: opts?.design });
  const img = await loadImage(design.src);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');

  ctx.drawImage(img, 0, 0);

  const W = canvas.width;
  const H = canvas.height;
  const maxWidth = W * 0.8; // 한글 약 20자까지 한 줄 유지 — 화면(layoutMessage)과 동일 기준

  const fontFamily =
    "'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 문구 분할은 글자 수 기반(15자) — 화면(messageLines)과 동일 기준.
  // 최장 줄이 최대 폭을 넘으면 화면과 같은 규칙으로 폰트를 비례 축소한다.
  const msgSize = Math.round(W * 0.038);
  ctx.font = `700 ${msgSize}px ${fontFamily}`;
  const lines = messageLines(card.message);
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const drawSize = widest > maxWidth ? Math.floor((msgSize * maxWidth) / widest) : msgSize;

  const hasNote = !!opts?.note?.trim();

  // 날짜(yy.mm.dd) — 아트의 리본 배너 중심에 얹는다
  const dateSize = Math.round(W * 0.034);
  ctx.font = `800 ${dateSize}px ${fontFamily}`;
  ctx.fillStyle = design.ribbonInk;
  ctx.textBaseline = 'middle';
  // 화면(CSS letter-spacing: 0.06em)과 자간을 맞춘다 — 미지원 브라우저는 무시
  const spaced = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  spaced.letterSpacing = '0.06em';
  ctx.fillText(formatCardDate(), W / 2, H * design.ribbonY);
  spaced.letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';

  // 문구 — 아트의 점선(밑줄) 위에 글씨 쓰듯 얹는다. 각 줄의 baseline을
  // 실측 좌표(line1/line2)에 두면 글자 아랫부분이 점선 바로 위에 닿는다.
  const lineYs = [design.line1, design.line2];
  ctx.font = `700 ${drawSize}px ${fontFamily}`;
  ctx.fillStyle = design.ink;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, H * lineYs[i]);
  });

  // 받는 사람 한마디 — 같은 방식으로 noteY 점선 위에
  if (hasNote) {
    const noteSize = Math.round(W * 0.031);
    ctx.font = `700 ${noteSize}px ${fontFamily}`;
    ctx.fillStyle = design.accent;
    ctx.fillText(ellipsize(ctx, opts!.note!.trim(), W * 0.75), W / 2, H * design.noteY);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/** 현재 ctx 폰트 기준으로 maxWidth를 넘으면 말줄임표로 자른다 */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
  return s + '…';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 이미지 파일 공유 — Web Share API 우선, 안 되면 다운로드. 결과: 'shared' | 'downloaded' */
export async function shareCardImage(
  card: ComfortCard,
  opts?: { note?: string; design?: CardDesign | null },
): Promise<'shared' | 'downloaded'> {
  const blob = await renderCardImage(card, { note: opts?.note, design: opts?.design });
  const file = new File([blob], 'muziktiger-comfort.png', { type: 'image/png' });
  // 문구·한마디는 모두 이미지 안에 들어 있다. text를 넣으면 카톡에서 제목 아래 한 줄이
  // 더 붙으므로 title 한 줄만 넘긴다.
  const shareData: ShareData = {
    files: [file],
    title: '무직타이거 오늘의 위로',
  };

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우 등 → 다운로드로 폴백하지 않고 그대로 종료
      if ((e as DOMException)?.name === 'AbortError') return 'shared';
    }
  }

  downloadBlob(blob, 'muziktiger-comfort.png');
  return 'downloaded';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
