import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { ARTICLE } from './mvp-social-detail-data.js';

// Copy and identities mirror the supplied mobile reference feed. Visual
// structure stays in the shared Figma Feed Item / V5 renderer.
// P01 keeps its authored history so the updates timeline remains coherent.
const HOME = [
  {
    key: 'P06', name: 'Tom Lee', role: 'Co-Founder and Head of Research, Fundstrat', age: 'Updated 11 Sept',
    img: 'assets/thesis/reference-tom-lee.png',
    thesis: 'The S&P 500 remains set for another near-term rally. The latest setup points to a substantial September rally because bearish positioning and a potentially benign inflation reading leave room for a positive surprise.',
    tickers: [['SPY', 'ETF proxy']],
    proxyNote: 'Alva tracking proxy: S&P 500 to SPY. Not specified by the author. Price levels refer to the original asset.',
    links: [
      'https://fundstrat.com/client-portal/macro-strategy/flash/2026/03/10/prediction-markets-see-higher-oil-thru-june-longer-conflict-but-we-still-see-march-as-up-month/',
      'https://fundstrat.com/client-portal/macro-strategy/flash/2026/04/28/this-wed-may-be-fed-chair-powell-last-presser-equity-returns-under-powell-8-3-cagr-nominal-4-7-real-very-good-returns/',
      'https://fundstrat.com/client-portal/macro-strategy/flash/2026/08/06/markets-still-have-excessive-inflation-derangement-syndrome-and-july-jobs-and-july-cpi-should-quell-some-fears-we-see-sp-500-reaching-7900-8000-by-end-of-month/',
      'https://fundstrat.com/client-portal/macro-strategy/flash/2026/09/11/we-continue-to-expect-a-benign-august-core-cpi-fri-am-this-likely-leads-to-a-face-ripper-rally-in-the-next-week-or-so/',
    ],
  },
  {
    key: 'S05', name: 'Raoul Pal', role: 'Co-founder & CEO of Real Vision', age: 'Updated 11 Sept',
    img: 'assets/thesis/reference-raoul-pal.jpg',
    thesis: "Nvidia's chip demand remains structurally strong despite an electricity bottleneck. Electricity, not demand or financing, is the binding constraint on AI infrastructure. Hyperscalers may temporarily slow chip purchases while waiting for power, but Nvidia's product cycle and double-exponential intelligence demand should sustain the need for increasingly powerful chips.",
    tickers: [['NVDA']], links: ['https://x.com/RaoulGMI/status/2098230682518434014'],
  },
  {
    key: 'P04', name: 'Raoul Pal', role: 'Co-founder & CEO of Real Vision', age: 'Updated 10 Sept',
    img: 'assets/thesis/reference-raoul-pal.jpg',
    thesis: "Named AI leaders cannot slow investment without conceding the frontier to rivals. Microsoft, Alphabet, Anthropic, OpenAI, Meta, Nvidia, and AMD are locked into a Red Queen competition in which pausing makes rivals' deployed capital more valuable. Even a frontier-lab failure should accelerate acquisition, compute concentration, and replacement capex rather than end the buildout.",
    tickers: [['MSFT'], ['GOOGL'], ['META'], ['NVDA'], ['AMD']],
    links: ['https://x.com/i/status/2097382441073741935', 'https://x.com/RaoulGMI/status/2097823101694189975'],
  },
  {
    key: 'S01', name: 'Jim Rogers', role: '@AllJimRogers', age: 'Updated 8 Sept',
    img: 'assets/thesis/reference-jim-rogers.jpg',
    thesis: 'Oil can rise further if a genuine supply shortage develops. Oil has already risen too far to buy now, but a genuine shortage of available reserves would push prices higher.',
    tickers: [['USO', 'ETF proxy']],
    proxyNote: 'Alva tracking proxy: Crude oil to USO. Not specified by the author. Price levels refer to the original asset.',
    links: ['https://en.oninvest.com/article/i-like-to-buy-things-that-nobody-else-is-interested-in-yet-an-interview-with-jim-rogers'],
  },
  {
    key: 'P07', name: 'Chamath Palihapitiya', role: '@chamath', age: 'Updated 6 Sept',
    img: 'assets/thesis/reference-chamath.jpg',
    thesis: "Tesla's autonomy platform is compelling enough to support a robotaxi fleet. Tesla combines a sensor-rich vehicle, onboard computing, and a vertically integrated autonomy platform; after its Cybercab deployment, the opportunity is compelling enough to build a personal robotaxi fleet.",
    tickers: [['TSLA']],
    links: ['https://x.com/chamath/status/2051027755194806781', 'https://x.com/chamath/status/2083227594506592329', 'https://chamath.substack.com/p/uber-waymo-and-tesla-race-for-robotaxis'],
  },
  {
    key: 'P02', name: 'Chamath Palihapitiya', role: '@chamath', age: 'Updated 6 Sept',
    img: 'assets/thesis/reference-chamath.jpg',
    thesis: "Nvidia can move up the AI stack as open models commoditize intelligence. Nvidia's margins, execution, and economically accretive products distinguish it from weaker software businesses; CUDA and expansion into open models, hosting, APIs, and cloud services can support a broader full-stack position.",
    tickers: [['NVDA']],
    links: [
      'https://allinchamathjason.libsyn.com/anthropics-generational-run-openai-panics-ai-moats-meta-loses-lawsuits',
      'https://x.com/chamath/status/2050275051761705133',
      'https://allinchamathjason.libsyn.com/nvidias-historic-quarter-saas-comeback-bessent-vs-druck-americas-debt-crisis-cancer-vaccine',
      'https://x.com/chamath/status/2095511879951192279',
      'https://allinchamathjason.libsyn.com/gpt-6-hits-agi-tech-euphoria-20-sf-mansion-shortage-nyc-bans-ai-in-schools-venezuela-oil-deal',
      'https://chamath.substack.com/p/uber-waymo-and-tesla-race-for-robotaxis',
    ],
  },
  {
    key: 'S02', name: 'Cathie Wood', role: '@CathieDWood', age: 'Updated 5 Sept',
    img: 'assets/thesis/reference-cathie-wood.jpg',
    thesis: "Tesla's vertical integration should produce the lowest-cost robotaxi network. Tesla's integrated vehicle, autonomy, and operating platform should drive robotaxi costs far below current ride-hailing prices and below less integrated autonomous competitors, while improving road safety.",
    tickers: [['TSLA']],
    links: ['https://www.bloomberg.com/news/audio/2026-05-06/bloomberg-businessweek-daily-cathie-wood-at-milken-podcast', 'https://x.com/CathieDWood/status/2064076685981696108', 'https://x.com/CathieDWood/status/2096167207705174265'],
  },
  {
    key: 'S06', name: 'Cathie Wood', role: '@CathieDWood', age: 'Updated 5 Sept',
    img: 'assets/thesis/reference-cathie-wood.jpg',
    thesis: "Square's ManagerBot is an early example of embedded AI lowering operating burdens for merchants, and Block's post-reorganization product velocity shows AI translating into broad delivery across Cash App and Square.",
    tickers: [['XYZ']], links: ['https://x.com/CathieDWood/status/2036491499039498376', 'https://x.com/CathieDWood/status/2096124645590126973'],
  },
  {
    key: 'S04', name: 'Cathie Wood', role: '@CathieDWood', age: 'Updated 5 Sept',
    img: 'assets/thesis/reference-cathie-wood.jpg',
    thesis: "Robinhood can benefit from bringing net-new users on-chain because those users should expand liquidity and strengthen the platform's credibility in crypto.",
    tickers: [['HOOD']], links: ['https://x.com/CathieDWood/status/2096108671180673044'],
  },
  {
    key: 'S07', name: 'Raoul Pal', role: 'Co-founder & CEO of Real Vision', age: 'Updated 4 Sept',
    img: 'assets/thesis/reference-raoul-pal.jpg',
    thesis: 'The Nasdaq is highly correlated with global liquidity and has historically compounded above currency debasement because the economy keeps becoming more digital. That makes it a strong long-term asset even when weekly narratives focus on earnings or news.',
    tickers: [['QQQ', 'ETF proxy']],
    proxyNote: 'Alva tracking proxy: NDX to QQQ. Not specified by the author. Price levels refer to the original asset.',
    links: ['https://x.com/i/status/2044478475516424388', 'https://x.com/RaoulGMI/status/2072716775557345660', 'https://raoulpal.substack.com/p/why-traditional-portfolios-stopped', 'https://x.com/RaoulGMI/status/2095890968876634193'],
  },
  {
    key: 'P01', preserveDetail: true, img: 'assets/thesis/reference-gavin-baker.jpg',
  },
];

const TICKER_ASSETS = {
  SPY: 'assets/onboarding-spy.svg', NVDA: 'assets/feed-logo-nvda-real.png', MSFT: 'assets/feed-logo-msft-real.svg',
  GOOGL: 'assets/feed-logo-goog.svg', META: 'assets/feed-logo-meta.svg', AMD: 'assets/feed-logo-amd.svg',
  TSLA: 'assets/market-logo-tsla.svg', HOOD: 'assets/filter-logo-hood.svg', QQQ: 'assets/onboarding-qqq.svg',
  USO: 'assets/thesis/reference-logo-uso.png', XYZ: 'assets/thesis/reference-logo-xyz.svg',
};

const CHART_ASSETS = {
  SPY: 'assets/thesis/reference-chart-spy.png',
  NVDA: 'assets/thesis/S02-imgChart1.png',
  MSFT: 'assets/thesis/first-card-imgChart1.png',
  GOOGL: 'assets/thesis/P01-imgChart1.png',
  META: 'assets/thesis/reference-chart-meta.png',
  AMD: 'assets/thesis/reference-chart-amd.png',
  USO: 'assets/thesis/reference-chart-uso.png',
  TSLA: 'assets/thesis/reference-chart-tsla.png',
  XYZ: 'assets/thesis/reference-chart-xyz.png',
  HOOD: 'assets/thesis/reference-chart-hood.png',
  QQQ: 'assets/thesis/reference-chart-qqq.png',
};

function shuffled(items, random) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function sourceRecords(record) {
  return record.links.map(url => ({
    id: record.name, name: record.name, role: record.role, handle: '',
    time: record.age, img: record.img, url, quote: record.thesis, summary: record.thesis,
    attribution: record.name, bot: record.name === 'Chamath Palihapitiya',
  }));
}

function tickerRecords(record) {
  return record.tickers.map(([sym]) => ({
    sym, co: sym, stance: 'flat', logo: TICKER_ASSETS[sym], interactive: false,
  }));
}

export function thesisCards(cards, random = Math.random) {
  const home = HOME.map(record => {
    const card = cards.find(item => item.social.key === record.key);
    if (!card) throw new Error('Missing Thesis card: ' + record.key);
    if (record.preserveDetail) {
      const art = assets.P01;
      const source = { ...card.sources[0], img: record.img };
      const social = { ...card.social, nodeId: card.social.nodeId, generationMode: 'manual', thesisType: 'Thesis update',
        charts: Object.entries(art).filter(([name]) => /^imgChart/.test(name)).map(([, src]) => src),
        paragraphs: ARTICLE.paragraphs };
      return { ...card, age: social.age, social, sources: [source], blocks: [] };
    }
    const sources = sourceRecords(record);
    const paragraphs = [record.thesis];
    if (record.proxyNote) paragraphs.push(record.proxyNote);
    const social = { ...card.social, age: record.age, generationMode: 'auto', thesisType: 'New thesis',
      statements: [record.thesis], paragraphs, analysis: record.thesis,
      charts: record.tickers.map(([sym]) => CHART_ASSETS[sym]), media: [] };
    const referenceNodeId = record.tickers.length > 1 ? '5794:126758' : '5794:126878';
    return { ...card, referenceNodeId, age: record.age, social, sources,
      tickers: tickerRecords(record), blocks: [] };
  });
  return shuffled(home, random);
}

export const ASSET_TYPES = ['All', 'US Stock', 'Non-US Stock', 'Binance Spot', 'Hyperliquid Spot'];
export const SEARCH_TICKERS = [
  ['NVDA', 'NVIDIA Corporation', '223.67 USD', '-0.87%', 'US Stock', 'imgLogoComp'],
  ['TSLA', 'Tesla, Inc.', '367.81 USD', '-0.08%', 'US Stock', 'imgLogoComp1'],
  ['MSFT', 'Microsoft Corporation', '491.65 USD', '-0.44%', 'US Stock', 'imgLogoComp2'],
  ['GOOGL', 'Alphabet Inc.', '330.65 USD', '-2.28%', 'US Stock'],
  ['AMZN', 'Amazon.com, Inc.', '252.40 USD', '-1.78%', 'US Stock', 'imgLogoComp3'],
  ['META', 'Meta Platforms, Inc.', '718.2 USD', '-0.4%', 'US Stock'],
  ['9988.HK', 'Alibaba Group', '110.3 HKD', '+0.18%', 'Non-US Stock', 'imgImage'],
  ['BTC', 'Bitcoin', '77,636.83 USDT', '+0.26%', 'Binance Spot', 'imgGroup2'],
  ['HYPE', 'Hyperliquid', '83.248 USDC', '+0.58%', 'Hyperliquid Spot'],
].map(([sym, co, price, change, assetType, logo]) => ({ sym, co, price, change, assetType, img: assets.search[logo],
  aliases: sym === 'MSFT' ? ['Azure', 'Microsoft Azure datacenter capacity and annual revenue'] : [] }));

export const PEOPLE = [
  ['Gavin Baker', 'Managing Partner & CIO, Atreides', 'imgAvatar'],
  ['Satya Nadella', 'Chairman & CEO, Microsoft', 'imgAvatar1'],
  ['Chamath Palihapitiya', '@chamath', 'imgLeadingVisual'],
  ['Sam Altman', 'Co-founder, OpenAI', 'imgAvatar2'],
  ['Warren Buffett', 'Chairman & CEO, Berkshire Hathaway', 'imgAvatar3'],
  ['Elon Musk', 'CEO, SpaceX', 'imgAvatar4'],
  ['Dario Amodei', 'Co-founder & CEO, Anthropic', 'imgAvatar5'],
  ['Jensen Huang', 'Founder & CEO, NVIDIA', 'imgAvatarJensenHuang'],
].map(([name, role, asset]) => ({ id: name, name, role, img: assets.search[asset], bot: name === 'Chamath Palihapitiya',
  crop: name === 'Jensen Huang' }));
