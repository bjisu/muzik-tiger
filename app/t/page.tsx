'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logEvent, rememberNfcParams } from '@/lib/analytics';

/**
 * NFC 진입 라우트 — NTAG의 URL 레코드가 이 주소를 가리킨다.
 * https://<host>/t?g=<goodsId>&c=comfort&b=<batchId>
 */
function NfcEntry() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const goodsId = params.get('g');
    const batchId = params.get('b');
    rememberNfcParams(goodsId, batchId);
    logEvent('tag_open', {
      ...(goodsId ? { goodsId } : {}),
      ...(batchId ? { batchId } : {}),
    });
    router.replace('/');
  }, [params, router]);

  return null;
}

export default function NfcEntryPage() {
  return (
    <main className="splash">
      <Suspense fallback={null}>
        <NfcEntry />
      </Suspense>
    </main>
  );
}
