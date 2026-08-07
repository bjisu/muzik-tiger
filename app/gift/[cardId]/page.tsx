'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComfortCardView from '@/components/ComfortCardView';
import { useToast } from '@/components/Toast';
import { cardById } from '@/lib/cards';
import { renderCardImage, shareCardImage, downloadBlob } from '@/lib/share';
import { logEvent } from '@/lib/analytics';

declare global {
  interface Window {
    Kakao?: any;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

/** C-03 선물 공유 — 카드 프리뷰 + 받는 사람 한마디 + 카카오/인스타 공유 (기획서 6) */
export default function GiftPage() {
  const params = useParams<{ cardId: string }>();
  const card = cardById(params.cardId);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (card) logEvent('gift_open', { cardId: card.id });
  }, [card]);

  // 카카오 SDK 로드(키가 설정된 경우에만)
  useEffect(() => {
    if (!KAKAO_KEY || window.Kakao) return;
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
    };
    document.head.appendChild(script);
  }, []);

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

  /** 카카오톡으로 선물하기 — SDK가 있으면 카카오 공유, 없으면 시스템 공유 시트 폴백 */
  const onKakao = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (KAKAO_KEY && window.Kakao?.isInitialized()) {
        const url = window.location.href;
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '무직타이거 오늘의 위로 🧡',
            description: `“${card.message}”`,
            imageUrl: new URL('/cards/tradition.webp', url).toString(),
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: '위로 카드 열기', link: { mobileWebUrl: url, webUrl: url } }],
        });
        logEvent('gift_share', { cardId: card.id, channel: 'kakao' });
      } else {
        // 문구와 한마디는 모두 이미지 안에 크게 들어가므로, 텍스트 메시지는 따로 보내지 않는다
        const result = await shareCardImage(card, { note });
        logEvent('gift_share', { cardId: card.id, channel: 'share_sheet' });
        if (result === 'downloaded') showToast('카드 이미지를 저장했어요. 카톡에 첨부해 보내주세요!');
      }
    } catch {
      showToast('공유에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  /** 인스타 스토리 공유 — 이미지 파일 공유(사용자가 인스타 선택), 폴백은 이미지 저장 */
  const onInsta = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await renderCardImage(card, { note });
      const file = new File([blob], 'muziktiger-comfort.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '무직타이거 오늘의 위로' });
      } else {
        downloadBlob(blob, 'muziktiger-comfort.png');
        showToast('이미지를 저장했어요. 인스타 스토리에 올려주세요!');
      }
      logEvent('gift_share', { cardId: card.id, channel: 'instagram' });
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

        <ComfortCardView card={card} note={note} />

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
          <button className="btn btn-dark" disabled={busy} onClick={onKakao}>
            {busy ? '카드 만드는 중…' : '카카오톡으로 선물하기'}
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={onInsta}>
            인스타 스토리 공유
          </button>
        </div>
      </main>
      {toast}
    </>
  );
}
