'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** C-00 스플래시 — 로고 표시 후 1.4초 뒤 /today 자동 전환 (기획서 2.1) */
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/today');
    const t = setTimeout(() => router.replace('/today'), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="splash">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="MUZIK TIGER STUDIOS" className="splash-logo" />
      <div className="splash-caption">Daily Comfort</div>
      <div className="splash-sub">오늘의 위로</div>
      <div className="splash-dots" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
