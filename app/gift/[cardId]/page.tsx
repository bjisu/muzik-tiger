'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import ComfortCardView from '@/components/ComfortCardView';
import { useToast } from '@/components/Toast';
import { cardById, isCardDesign } from '@/lib/cards';
import { renderCardImage, downloadBlob } from '@/lib/share';
import { logEvent } from '@/lib/analytics';

const FILE_NAME = 'muziktiger-comfort.png';
/** 공유 시트에 실리는 제목. 앞뒤 공백이 있으면 카톡에서 빈 줄로 렌더되므로 붙이지 않는다 */
const SHARE_TITLE = 'MUZIK TIGER 오늘의 위로';

/**
 * iOS는 a[download]로 사진 앱에 저장할 수 없다(새 탭으로 열릴 뿐).
 * 유일한 경로가 공유 시트의 "이미지 저장"이라 저장 버튼도 시트를 띄운다.
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** C-03 선물 공유 — 카드 프리뷰 + 받는 사람 한마디 + 이미지 저장 / OS 공유 (기획서 6) */
export default function GiftPage() {
  const params = useParams<{ cardId: string }>();
  const searchParams = useSearchParams();
  const card = cardById(params.cardId);
  // 보내는 사람이 본 디자인(?d=forest). 없으면 오늘 날짜 기준 배정
  const dParam = searchParams.get('d');
  const fixedDesign = isCardDesign(dParam) ? dParam : undefined;
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (card) logEvent('gift_open', { cardId: card.id });
  }, [card]);

  if (!card) {
    return (
      <main className="gift-main" style={{ justifyContent: 'center' }}>
        <p>카드를 찾을 수 없어요.</p>
        <Link href="/today" className="btn btn-primary" style={{ flex: 'none' }}>
          오늘의 위로 보러 가기
        </Link>
      </main>
    );
  }

  const buildImage = async () => {
    const blob = await renderCardImage(card, { note, design: fixedDesign });
    return { blob, file: new File([blob], FILE_NAME, { type: 'image/png' }) };
  };

  /** 이미지 저장하기 — 갤러리(사진 앱)에 저장 */
  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, file } = await buildImage();
      if (isIOS() && navigator.canShare?.({ files: [file] })) {
        showToast('공유 시트에서 “이미지 저장”을 선택해 주세요.');
        await navigator.share({ files: [file], title: SHARE_TITLE });
      } else {
        downloadBlob(blob, FILE_NAME);
        showToast('이미지를 저장했어요. 갤러리에서 확인해 보세요!');
      }
      logEvent('gift_share', { cardId: card.id, channel: 'save' });
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        showToast('저장에 실패했어요. 다시 시도해 주세요.');
      }
    } finally {
      setBusy(false);
    }
  };

  /** 공유하기 — OS 기본 공유 시트(카톡·인스타 등은 사용자가 시트에서 고른다) */
  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, file } = await buildImage();
      if (navigator.canShare?.({ files: [file] })) {
        // 문구·한마디가 이미지 안에 들어 있으므로 text는 붙이지 않는다
        await navigator.share({ files: [file], title: SHARE_TITLE });
      } else {
        downloadBlob(blob, FILE_NAME);
        showToast('이 브라우저는 공유를 지원하지 않아 이미지를 저장했어요.');
      }
      logEvent('gift_share', { cardId: card.id, channel: 'share_sheet' });
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        showToast('공유에 실패했어요. 다시 시도해 주세요.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="top-bar">
        <Link href="/today" className="back-btn">
          ← 돌아가기
        </Link>
      </header>

      <main className="gift-main">
        <div className="gift-title">친구에게 선물 🎁</div>
        <div className="gift-sub">오늘의 위로를 소중한 사람에게 전해보세요</div>

        <ComfortCardView card={card} note={note} design={fixedDesign} />

        <div className="gift-note">
          <label htmlFor="gift-note-input">받는 사람에게 한마디</label>
          <input
            id="gift-note-input"
            value={note}
            maxLength={40}
            placeholder="예) 네 곁엔 내가 있잖아 🧡"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="gift-actions">
          <button className="btn btn-dark" disabled={busy} onClick={onSave}>
            {busy ? '카드 만드는 중…' : '이미지 저장하기'}
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={onShare}>
            공유하기
          </button>
        </div>
      </main>
      {toast}
    </>
  );
}
