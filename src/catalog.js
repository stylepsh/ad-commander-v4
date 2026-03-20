/* ========================================
   AD COMMANDER v3.0 — 상품(슬롯) 카탈로그
   네이버 / 쿠팡 / 오늘의집 서비스 목록
   ======================================== */

/* ========= 네이버 슬롯 서비스 ========= */
export const NAVER_PRODUCTS = [
  { type: '리워드', name: 'K1', days: 10, url: '', cost: 22000, refund: 'O', notes: '' },
  { type: '리워드', name: 'K2', days: 10, url: '', cost: 41800, refund: 'O', notes: '' },
  { type: '리워드', name: 'K5', days: 10, url: 'http://k5-2024.com/', cost: 33000, refund: 'O', notes: '' },
  { type: '리워드', name: '소보루', days: 10, url: 'http://49.247.40.121/index.php', cost: 33000, refund: 'O', notes: '' },
  { type: '리워드', name: '플러스', days: 10, url: 'http://plusslot.club/login', cost: 30800, refund: 'O', notes: '' },
  { type: '복합플', name: '하이드', days: 10, url: '', cost: 31900, refund: 'O', notes: '' },
  { type: '복합플', name: '복합플1219', days: 10, url: 'https://www.reward-1219.com/', cost: 19800, refund: 'O', notes: '' },
  { type: '리워드', name: '스페이스', days: 10, url: 'http://xn--hy1b74g1qja534cz2au53d.com/login', cost: 27500, refund: 'O', notes: '' },
  { type: '리워드', name: '솜사탕', days: 10, url: 'https://somsatang.aws998487.com/', cost: 40700, refund: 'O', notes: '' },
  { type: '리워드', name: 'DEEP', days: 10, url: 'http://54.180.196.140/login.php', cost: 30800, refund: 'O', notes: '' },
  { type: '리워드', name: '블렌딩', days: 10, url: 'https://www.blending.store/', cost: 30800, refund: 'O', notes: '' },
  { type: '리워드', name: '코드', days: 10, url: 'http://code-slot.club/login', cost: 25300, refund: 'O', notes: '' },
  { type: '리워드', name: '스카이', days: 10, url: 'http://sky-slot.club/', cost: 18700, refund: 'O', notes: 'AI' },
  { type: '리워드', name: '에어', days: 10, url: 'http://49.247.42.224/index.php', cost: 16500, refund: 'O', notes: '' },
  { type: '리워드', name: '777', days: 10, url: 'https://777shop.kr/slot', cost: 22000, refund: 'O', notes: '' },
  { type: '리워드', name: '소다', days: 10, url: 'https://sodareward.co.kr/', cost: 18700, refund: 'O', notes: '' },
  { type: '리워드', name: '소보루 플러스', days: 10, url: 'https://so-plus.co.kr', cost: 27500, refund: 'O', notes: '' },
  { type: '유입플', name: '엘리트', days: 10, url: 'https://elite-kt.com/login.php', cost: 15400, refund: 'O', notes: '' },
];

/* ========= 쿠팡 슬롯 서비스 ========= */
export const COUPANG_PRODUCTS = [
  { type: '쿠팡', name: 'cp', days: 30, url: 'http://cp.nurian.club/index.php', cost: 34100, refund: '', notes: '' },
  { type: '쿠팡', name: '오로라', days: 30, url: 'http://166.88.14.19/contents/web/loginForm.do', cost: 38500, refund: '', notes: '' },
  { type: '쿠팡', name: '콩콩', days: 30, url: 'https://kongkong.work/index.php', cost: 22000, refund: '', notes: '' },
  { type: '쿠팡', name: '시그니처', days: 30, url: 'https://www.signature-pang.com', cost: 30800, refund: '', notes: '' },
  { type: '쿠팡', name: '팡팡 600', days: 30, url: 'http://newpangpang.shop/', cost: 60500, refund: '', notes: '' },
  { type: '쿠팡', name: '헤르메스', days: 30, url: 'https://hermes-pang.com', cost: 36300, refund: '', notes: '' },
  { type: '쿠팡', name: 'COKE', days: 30, url: 'https://coke.vu/', cost: 37400, refund: '', notes: '' },
  { type: '쿠팡', name: '플러스 코크', days: 30, url: 'https://plus.coke.vu/', cost: 31900, refund: 'O', notes: 'coke 업그레이드버전' },
  { type: '쿠팡', name: '프라다', days: 30, url: 'https://www.prada-pang.com/', cost: 30800, refund: '', notes: '' },
  { type: '쿠팡', name: '파인드', days: 30, url: 'http://find-c.net/', cost: 16500, refund: '', notes: '' },
  { type: '쿠팡', name: '브이링크', days: 30, url: 'http://v-link.club/', cost: 16500, refund: '', notes: '' },
  { type: '쿠팡', name: '벨라', days: 30, url: 'http://www.vela2.com/index.php', cost: 16500, refund: '', notes: '' },
  { type: '쿠팡', name: '판타스틱', days: 30, url: 'https://www.fantastic-pang.com/board/', cost: 18700, refund: '', notes: '' },
  { type: '쿠팡', name: '크랭크', days: 30, url: 'https://crank.ai.kr/users', cost: 19800, refund: '', notes: '' },
];

/* ========= 오늘의집 슬롯 서비스 ========= */
export const OHOUSE_PRODUCTS = [
  { type: '리워드', name: '오늘리워드', days: 10, url: '', cost: 33000, refund: 'O', notes: '' },
  { type: '리워드', name: '데코', days: 10, url: 'http://141.164.54.38/', cost: 33000, refund: 'O', notes: '' },
];

/* ========= 전체 카탈로그 ========= */
export const ALL_PRODUCTS = [
  ...NAVER_PRODUCTS.map(p => ({ ...p, platform: '네이버' })),
  ...COUPANG_PRODUCTS.map(p => ({ ...p, platform: '쿠팡' })),
  ...OHOUSE_PRODUCTS.map(p => ({ ...p, platform: '오늘의집' })),
];

/* ========= 카톡 보고 양식 템플릿 ========= */
export const KAKAO_TEMPLATES = {
  slot_open: {
    label: '✔ 슬롯 오픈건',
    fields: ['type', 'date', 'payer', 'manager', 'company', 'work', 'keyword', 'slotNumbers', 'deadline', 'id', 'pw'],
    generate: (d) => {
      let msg = `✔ 슬롯 오픈건 ✔\n\n*${d.type || '신규'}\n날짜 ${d.date || ''}\n\n입금여부(입금자명까지) ${d.payer || ''}\n\n담당자 : ${d.manager || ''}\n업체명 : ${d.company || ''}\n작업 방식 (개수 포함) : ${d.work || ''}`;
      if (d.keyword) msg += `\n작업 키워드 (미드값 포함) : ${d.keyword}`;
      if (d.slotNumbers) msg += `\n\n${d.slotNumbers}`;
      if (d.deadline) msg += `\n\n마감일 ${d.deadline}`;
      msg += `\n\nid : ${d.id || ''}\npw : ${d.pw || ''}`;
      return msg;
    }
  },
  slot_extend: {
    label: '🔄 연장',
    fields: ['date', 'payer', 'manager', 'company', 'work', 'keyword', 'slotNumbers', 'deadline', 'id', 'pw'],
    generate: (d) => {
      let msg = `✔ 슬롯 오픈건 ✔\n\n* 연장\n날짜 ${d.date || ''}\n\n입금여부(입금자명까지) ${d.payer || ''}\n\n담당자 : ${d.manager || ''}\n업체명 : ${d.company || ''}\n작업 방식 (개수 포함) : ${d.work || ''}`;
      if (d.keyword) msg += `\n작업 키워드 (미드값 포함) : ${d.keyword}`;
      if (d.slotNumbers) msg += `\n\n${d.slotNumbers}`;
      if (d.deadline) msg += `\n\n마감일 ${d.deadline}`;
      msg += `\n\nid : ${d.id || ''}\npw : ${d.pw || ''}`;
      return msg;
    }
  },
  k5_refund: {
    label: '💸 K5 환불요청',
    fields: ['account', 'slotNumbers', 'qty', 'startDate', 'endDate'],
    generate: (d) => {
      return `[K5환불요청]\n계정 : ${d.account || ''}\n슬롯번호(시작일 순) : ${d.slotNumbers || ''}\n수량 : ${d.qty || ''}\n시작일 : ${d.startDate || ''}\n마감일 : ${d.endDate || ''}`;
    }
  },
  k2_refund: {
    label: '💸 K2 환불 양식',
    fields: ['keyword', 'qty', 'productLink', 'startDate', 'endDate', 'storeName'],
    generate: (d) => {
      return `[K2 환불 양식]\n\n키워드 : ${d.keyword || ''}\n수량 : ${d.qty || ''}\n상품링크(요청링크) : ${d.productLink || ''}\n\n시작일 : ${d.startDate || ''}\n마감일 : ${d.endDate || ''}\n스토어명 : ${d.storeName || ''}`;
    }
  },
  k1_refund: {
    label: '💸 K1 환불 양식',
    fields: ['keyword', 'qty', 'productLink', 'startDate', 'endDate', 'storeName'],
    generate: (d) => {
      return `[K1 환불 양식]\n\n키워드 : ${d.keyword || ''}\n수량 : ${d.qty || ''}\n상품링크(요청링크) : ${d.productLink || ''}\n\n시작일 : ${d.startDate || ''}\n마감일 : ${d.endDate || ''}\n스토어명 : ${d.storeName || ''}`;
    }
  },
  hide_refund: {
    label: '💸 하이드 환불 양식',
    fields: ['keyword', 'qty', 'productLink', 'startDate', 'endDate', 'storeName'],
    generate: (d) => {
      return `[하이드 환불 양식]\n\n키워드 : ${d.keyword || ''}\n수량 : ${d.qty || ''}\n상품링크(요청링크) : ${d.productLink || ''}\n\n시작일 : ${d.startDate || ''}\n마감일 : ${d.endDate || ''}\n스토어명 : ${d.storeName || ''}`;
    }
  },
  hide_order: {
    label: '📋 하이드양식',
    fields: ['qty', 'startDate', 'mainKeyword', 'subKeyword1', 'link'],
    generate: (d) => {
      return `하이드양식\n\n수량 : ${d.qty || ''}\n일자 : ${d.startDate || ''}\n메인키워드 : ${d.mainKeyword || ''}\n1위내키워드 : ${d.subKeyword1 || ''}\n링크 : ${d.link || ''}`;
    }
  },
  smartstore_monthly: {
    label: '📊 스마트스토어 월보장',
    fields: ['keyword', 'refundLink', 'storeLink', 'midValue', 'views'],
    generate: (d) => {
      return `스마트스토어 월보장\n\n키워드 : ${d.keyword || ''}\n원부링크 : ${d.refundLink || ''}\n스토어링크 : ${d.storeLink || ''}\n스토어 미드값 : ${d.midValue || ''}\n조회수 : ${d.views || ''}`;
    }
  },
  coupang_monthly: {
    label: '📊 쿠팡월보장견적요청',
    fields: ['keyword', 'link', 'midValue', 'rocketBasic'],
    generate: (d) => {
      return `쿠팡월보장견적요청\n키워드 : ${d.keyword || ''}\n링크 : ${d.link || ''}\n단일미드값 : ${d.midValue || ''}\n로켓 제도 일반 여부 : ${d.rocketBasic || ''}`;
    }
  },
  timing: {
    label: '⏰ 타이밍양식',
    fields: ['keyword', 'qty', 'productLink', 'startDate', 'endDate', 'storeName'],
    generate: (d) => {
      return `타이밍양식\n\n키워드 : ${d.keyword || ''}\n수량 : ${d.qty || ''}\n상품링크(요청링크) : ${d.productLink || ''}\n\n시작일 : ${d.startDate || ''}\n마감일 : ${d.endDate || ''}\n스토어명 : ${d.storeName || ''}`;
    }
  },
  mad: {
    label: '📋 매드',
    fields: ['count', 'keyword', 'priceCompare', 'midValue', 'productUrl', 'productMidValue'],
    generate: (d) => {
      return `매드\n\n갯수 : ${d.count || ''}\n키워드 : ${d.keyword || ''}\n가격비교 : ${d.priceCompare || ''}\n미드값 : ${d.midValue || ''}\n상품url : ${d.productUrl || ''}\n미드값 : ${d.productMidValue || ''}`;
    }
  },
};

/* ========= 필드 라벨 맵핑 (한국어) ========= */
export const FIELD_LABELS = {
  type: '유형',
  date: '날짜',
  payer: '입금여부(입금자명)',
  manager: '담당자',
  company: '업체명',
  work: '작업 방식 (개수 포함)',
  keyword: '키워드',
  slotNumbers: '슬롯 번호',
  deadline: '마감일',
  id: 'ID',
  pw: 'PW',
  account: '계정',
  qty: '수량',
  startDate: '시작일',
  endDate: '마감일',
  productLink: '상품링크(요청링크)',
  storeName: '스토어명',
  mainKeyword: '메인키워드',
  subKeyword1: '1위내키워드',
  link: '링크',
  refundLink: '원부링크',
  storeLink: '스토어링크',
  midValue: '미드값',
  views: '조회수',
  rocketBasic: '로켓 제도 일반 여부',
  count: '갯수',
  priceCompare: '가격비교',
  productUrl: '상품url',
  productMidValue: '상품 미드값',
};
