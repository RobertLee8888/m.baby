// Feed-Mobile-MVP: 5742:114415 (list), 7287:76564 (detail).
// Original Figma image exports remain images; controls use Library SVGs.
const A = 'assets/';
const ticker = (symbol, stance = 'up') => ({ symbol, stance, logo: A + ({
  MSFT: 'feed-logo-msft-real.svg', GOOGL: 'feed-logo-goog.svg', AMZN: 'feed-logo-amzn.svg',
  NVDA: 'feed-logo-nvda-real.png', TEM: 'feed-logo-tem.png',
}[symbol]) });

export const POSTS = [
  {
    id: 'satya', name: 'Satya Nadella', role: 'Chairman & CEO, Microsoft', age: '1h ago',
    avatar: A + 'thesis/first-card-imgAvatar.png', tickers: [ticker('MSFT', 'down')],
    text: 'Azure surpassed $75 billion in annual revenue, up 34%.\nMicrosoft added more than two gigawatts of datacenter capacity over the previous 12 months and now had over 400 datacenters across 70 regions.',
    charts: [A + 'thesis/first-card-imgChart1.png'], saved: 32, date: '1h ago',
  },
  {
    id: 'gavin', name: 'Gavin Baker', role: 'Managing Partner & CIO, Atreides', age: 'Jul 13',
    avatar: A + 'thesis/P01-imgAvatar.png',
    tickers: [ticker('GOOGL', 'down'), ticker('AMZN'), ticker('MSFT'), ticker('NVDA')],
    text: 'Cheaper models would increase the return on AI spending and drive more token demand, redistributing margin dollars toward AI infrastructure providers.',
    charts: [A + 'thesis/P01-imgChart1.png', A + 'thesis/P01-imgChart2.png', A + 'thesis/first-card-imgChart1.png'], saved: 68, date: 'Jul 13',
  },
  {
    id: 'traderstewie', name: 'Traderstewie', role: 'Trader · Trade setup', age: '13 Sep',
    avatar: A + 'thesis/P01-imgAvatar.png', tickers: [ticker('GOOGL')],
    text: 'AMD is approaching its summer high as more buyers join the advance.\nThe stock has broken higher after its last pullback stopped above the previous low. Rising trading volume makes the recovery more convincing.',
    charts: [A + 'thesis/P01-imgChart1.png'], saved: 68, date: '13 Sep, 08:12',
  },
  {
    id: 'berkshire', name: 'Berkshire Hathaway', role: 'Conglomerate', age: '1h ago',
    avatar: A + 'thesis/S05-imgAvatar.png', tickers: [],
    text: "Berkshire's board unanimously appointed Greg Abel as President and CEO, effective January 1, 2026. Warren Buffett would remain Chairman of the Board.",
    charts: [A + 'thesis/S05-imgChart1.png'], saved: 41, date: '1h ago',
  },
  {
    id: 'sam', name: 'Sam Altman', role: 'Co-founder, OpenAI', age: '1h ago',
    avatar: A + 'thesis/P04-imgAvatar.png', tickers: [],
    text: 'Broad access to AI depends on abundant, affordable compute, supported by enough energy and chips.\nWithout that infrastructure, AI could become a scarce resource whose benefits concentrate among the wealthy.',
    charts: [], saved: 63, date: '1h ago',
  },
  {
    id: 'reuters', name: 'Reuters', role: 'News agency', age: '1h ago',
    avatar: A + 'thesis/S01-imgAvatar.png', tickers: [ticker('TEM')],
    text: 'Merck and Moderna said their personalized mRNA therapy met its primary endpoint and a key secondary endpoint in a late-stage melanoma trial, the first positive Phase 3 result for an mRNA cancer vaccine.',
    charts: [A + 'thesis/S01-imgChart1.png'], saved: 56, date: '1h ago',
  },
];

export const SIGNAL = {
  name: 'SemiAnalysis', role: 'Semiconductor & AI research', time: '12 Aug, 07:00',
  avatar: A + 'social-semianalysis.png',
  text: 'SemiAnalysis reports TPUv8i is in internal software bring-up, with work beginning on the public software stack.',
  url: 'https://x.com/SemiAnalysis_/status/2087298210066829389',
  analysis: 'TPU commercialization could support the infrastructure thesis; adoption and returns remain unproven.',
};

export const TOPICS = ['All', 'Chips', 'Memory', 'Hyperscaler', 'Neocloud'];
