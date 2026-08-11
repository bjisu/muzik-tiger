'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** C-00 스플래시 — 클로버를 든 캐릭터, 1.4초 뒤 /today 자동 전환 (기획서 2.1) */
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/today');
    const t = setTimeout(() => router.replace('/today'), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="splash">
      <div className="splash-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/lucky_tiger.webp"
          alt="네잎클로버를 든 무직타이거"
          className="splash-tiger"
        />
      </div>
      <div className="splash-caption">Daily Comfort</div>
      <div className="splash-sub">오늘의 위로</div>
      <div className="splash-hint">오늘의 위로가 도착하고 있어요</div>
      <div className="splash-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
