import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '무직타이거 · 오늘의 위로',
  description: '모니터 뚱랑이를 탭하면 매일 위로 한마디가 열립니다. DAILY COMFORT by MUZIK TIGER.',
  openGraph: {
    title: '무직타이거 · 오늘의 위로',
    description: '매일 다른 위로 한마디를 저장하고, 친구에게 선물처럼 공유하세요.',
    images: ['/cards/tradition.webp'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FBF6EC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="phone">{children}</div>
      </body>
    </html>
  );
}
