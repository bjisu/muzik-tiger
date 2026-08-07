import type { ComfortCard } from './types';
import { designOf, formatCardDate } from './cards';

/** 캔버스에 카드 이미지(배경 템플릿 + 문구 + 날짜 + 선물 한마디)를 렌더링해 Blob으로 반환 */
export async function renderCardImage(
  card: ComfortCard,
  opts?: { note?: string },
): Promise<Blob> {
  const design = designOf(card);
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

  // 날짜
  const dateSize = Math.round(W * 0.028);
  ctx.font = `600 ${dateSize}px ${fontFamily}`;
  ctx.fillStyle = design.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 문구 줄바꿈
  const msgSize = Math.round(W * 0.042);
  ctx.font = `700 ${msgSize}px ${fontFamily}`;
  const lines = wrapText(ctx, `“${card.message}”`, maxWidth);

  const lineHeight = msgSize * 1.5;
  const noteSize = Math.round(W * 0.03);
  const hasNote = !!opts?.note?.trim();
  // 선물 한마디가 있으면 날짜는 생략(텍스트 박스 밖 배너와 겹침 방지)
  const showDate = !hasNote;

  const blockHeight =
    (showDate ? dateSize * 1.9 : 0) + lines.length * lineHeight + (hasNote ? noteSize * 2.1 : 0);
  let y = boxCenterY - blockHeight / 2 + (showDate ? dateSize : 0);

  if (showDate) {
    ctx.font = `600 ${dateSize}px ${fontFamily}`;
    ctx.fillStyle = design.accent;
    ctx.fillText(formatCardDate(), W / 2, y);
    y += dateSize * 0.9;
  }

  ctx.font = `700 ${msgSize}px ${fontFamily}`;
  ctx.fillStyle = design.ink;
  for (const line of lines) {
    y += lineHeight;
    ctx.fillText(line, W / 2, y);
  }

  if (hasNote) {
    y += noteSize * 2.1;
    ctx.font = `500 ${noteSize}px ${fontFamily}`;
    ctx.fillStyle = design.accent;
    ctx.fillText(`♥ ${opts!.note!.trim()}`, W / 2, y);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
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
  opts?: { note?: string; text?: string },
): Promise<'shared' | 'downloaded'> {
  const blob = await renderCardImage(card, { note: opts?.note });
  const file = new File([blob], 'muziktiger-comfort.png', { type: 'image/png' });
  const shareData: ShareData = {
    files: [file],
    title: '무직타이거 오늘의 위로',
    text: opts?.text ?? `“${card.message}” — 무직타이거 오늘의 위로`,
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
