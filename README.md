# 무직타이거 · 오늘의 위로 (DAILY COMFORT)

모니터 뚱랑이(NFC 굿즈)를 탭하면 열리는 데일리 위로 카드 웹입니다.
설치·로그인 없이 브라우저에서 바로 열리며, 모든 데이터는 휴대폰에만 저장됩니다(Firebase 등 외부 서버 없음).

## 실행 방법 (Cursor)

1. Cursor에서 이 폴더(`muzik-comfort`)를 엽니다.
2. 하단 터미널을 열고(단축키 `` Ctrl+` ``) 아래를 한 줄씩 입력합니다.

```bash
npm install
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 을 열면 스플래시 → 오늘의 위로가 보입니다.
   (휴대폰처럼 보려면 브라우저 개발자도구에서 모바일 보기로 전환하세요.)

## 화면 구성

| 주소 | 화면 |
|---|---|
| `/` | 스플래시 (무직타이거 로고 → 1.4초 후 자동 전환) |
| `/today` | 오늘의 위로 카드 (저장 / 선물하기) |
| `/collection` | 내 위로 카드 컬렉션 (누적 장수 · N일 연속 배지 · 카드 상세 시트) |
| `/gift/카드ID` | 선물 공유 (받는 사람 한마디 + 카카오 / 인스타) |
| `/t?g=굿즈ID&c=comfort&b=배치ID` | **NFC 태그 진입 주소** (NTAG213/215에 이 URL을 기록) |

## 자주 바꾸게 될 것들

- **위로 문구 수정·추가** → `data/comfort-cards.json`
  - 현재 60개의 문구가 들어 있습니다. **원작(작가) 감수 전 임시 문구**이니 감수 완료본으로 교체해 주세요.
  - `category`: cheer(응원) / comfort(위로) / encourage(격려) / humor(유머) / remind(리마인드)
  - `weekday`(0=일요일 … 6=토요일), `timeslot`(morning/noon/evening/overtime)을 넣으면 해당 요일·시간대에 더 자주 나옵니다.
- **카드 배경 디자인 추가** → 이미지를 `public/cards/디자인이름.webp` 로 넣고, `lib/cards.ts` 의 `DESIGNS` 에 한 칸 추가하면 됩니다(문구 위치·색만 지정).
- **색감** → `app/globals.css` 맨 위 `:root` 에 모여 있습니다. 포인트 `#F18400`, 배경 `#FBF6EC`.

## 카카오톡 공유 (선택)

카카오 개발자 사이트에서 JavaScript 키를 발급받아 프로젝트 최상위에 `.env.local` 파일을 만들고 아래처럼 넣으면
"카카오톡으로 선물하기" 버튼이 카카오 공유로 동작합니다. 키가 없으면 자동으로 휴대폰 기본 공유 시트로 동작하니 없어도 됩니다.

```
NEXT_PUBLIC_KAKAO_JS_KEY=여기에_자바스크립트_키
```

## 배포 (Vercel)

1. [vercel.com](https://vercel.com)에 가입 후 이 프로젝트를 GitHub에 올리고 Vercel에서 Import 하면 끝입니다.
2. 배포 주소가 `https://내주소.vercel.app` 이라면, NFC 태그에는
   `https://내주소.vercel.app/t?g=DDR-001&c=comfort&b=2608` 형태로 기록하면 됩니다.

## 데이터 · 이벤트

- 저장 카드·연속 접속일은 휴대폰 `localStorage`에 보관됩니다 (`mzt_comfort_state_v1`).
- 반응 데이터(tag_open, card_view, card_save, card_share, gift_open, gift_share)는
  `mzt_comfort_events_v1` 키에 로컬로 쌓입니다. 추후 수집 서버가 생기면 `lib/analytics.ts` 한 곳만 고치면 됩니다.

## 폴더 구조

```
app/
  page.tsx              스플래시(로고)
  today/page.tsx        오늘의 위로
  collection/page.tsx   위로 카드 컬렉션 (+ 카드 상세 시트)
  gift/[cardId]/page.tsx 선물 공유
  t/page.tsx            NFC 진입(파라미터 기록 후 스플래시로)
components/  (ComfortCardView, Toast)
lib/         (cards.ts 선택로직, storage.ts 저장, share.ts 이미지 렌더·공유, analytics.ts 로깅)
data/        (comfort-cards.json 위로 문구)
public/brand (로고) · public/cards (카드 배경 3종: tradition / forest / beach)
```
