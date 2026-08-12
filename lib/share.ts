import type { CardDesign, ComfortCard } from './types';
import { designOf, formatCardDate } from './cards';

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
  const boxTop = H * design.textTop;
  const boxBottom = H * design.textBottom;
  const boxCenterY = (boxTop + boxBottom) / 2;
  const maxWidth = W * 0.72;

  const fontFamily =
    "'Pretendard', 'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 문구 줄바꿈
  const msgSize = Math.round(W * 0.038);
  ctx.font = `700 ${msgSize}px ${fontFamily}`;
  const lines = wrapText(ctx, `“${card.message}”`, maxWidth);

  const lineHeight = msgSize * 1.5;
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

  // 문구 — 위쪽 고정(top-anchor). 첫 줄 baseline은 줄 수와 무관하게 늘 같은 자리:
  // 1줄 문구가 예전 세로 중앙 정렬(중앙 + 카드 높이 0.5% 하향)에서 놓이던 위치다.
  // 줄이 늘어나면 lineHeight씩 아래로만 내려간다. 한마디 높이는 계산에서 제외.
  let y = boxCenterY + H * 0.005 + lineHeight / 2;

  ctx.font = `700 ${msgSize}px ${fontFamily}`;
  ctx.fillStyle = design.ink;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += lineHeight;
  }

  // 받는 사람 한마디 — 문구 흐름과 무관하게 텍스트 박스 하단 경계 위 고정 좌표에 그린다
  if (hasNote) {
    const noteSize = Math.round(W * 0.031);
    const noteLineH = Math.round(noteSize * 1.6);
    const maxNoteW = W * 0.75;

    ctx.font = `700 ${noteSize}px ${fontFamily}`;
    const noteText = ellipsize(ctx, opts!.note!.trim(), maxNoteW);
    const noteY = boxBottom - noteLineH - W * 0.015;

    ctx.fillStyle = design.accent;
    ctx.textBaseline = 'middle';
    ctx.fillText(noteText, W / 2, noteY + noteLineH / 2 + noteSize * 0.06);
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
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
