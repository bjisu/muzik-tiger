'use client';

import { useCallback, useRef, useState } from 'react';

/** 간단한 토스트 훅 — alert 대신 사용 */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  const node = msg ? <div className="toast">{msg}</div> : null;
  return [node, show];
}
