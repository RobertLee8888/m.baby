// Figma 5396:87894, 5595:91099, 5595:91189 and 5482:88375.
export const ARTICLE = {
  summary: 'Baker frames this as a possible shift, not an outcome already visible. If lower-priced open or closed models take share',
  paragraphs: [
    'Baker frames this as a possible shift, not an outcome already visible. If lower-priced open or closed models take share from frontier labs with high inference margins, customers could get more intelligence for each dollar and increase their token usage.',
    'Under that scenario, part of the profit pool could move from model providers to AI infrastructure. He sees low delivery cost per token as the infrastructure advantage, while token efficiency would matter most at the model layer.',
    "He links this argument to Jensen Huang's support for open source and to vertically integrated platforms. These are parts of Baker's investment thesis, not evidence that the redistribution has already occurred.",
    'His caveat is central: inexpensive tokens may represent much of current usage, while the most capable models still capture most economic value. Whether greater adoption changes that balance remains to be seen.',
  ],
};

export const SIGNALS = [
  { time: '12 Aug, 07:00', name: 'SemiAnalysis', img: 'assets/social-semianalysis.png',
    text: 'reports TPUv8i is in internal software bring-up, with work beginning on the public software stack.',
    analysis: 'TPU commercialization could support the infrastructure thesis; adoption and returns remain unproven.',
    url: 'https://x.com/SemiAnalysis_/status/2087298210066829389' },
  { time: '12 Aug, 03:00', name: 'Matt Bryson', img: 'assets/social-matt-bryson.png',
    text: ', Wedbush analyst, sees an opportunity for Marvell and TSMC as Microsoft prepares Maia 300.',
    analysis: 'Custom accelerators may lower compute costs; an unveiling is not evidence of deployment or returns.',
    url: 'https://www.tradingview.com/news/gurufocus:248b9d963094b:0-marvell-could-be-next-winner-in-microsoft-ai-bet/' },
  { time: '11 Aug, 23:00', name: 'Riot Platforms', img: 'assets/social-riot.png',
    text: 'announced a $9.1 billion compute supply deal; a source identified the customer as Anthropic.',
    analysis: 'The deal signals compute demand, but does not establish that cheaper models caused it.',
    url: 'https://www.tradingview.com/news/DJN_DN20260811005150:0/' },
];

export const EARLIER_VERSIONS = [
  { key: 'P01-jul10', age: 'Jul 10 · Demo',
    statement: 'Lower token costs could expand AI usage. Integrated platforms may capture more of that demand if they can deliver compute efficiently, but the shift in margins is not yet clear.',
    analysis: 'Usage growth alone does not establish who captures the margin.' },
  { key: 'P01-jul3', age: 'Jul 3 · Demo',
    statement: 'Lower-priced models could make more intelligence available per dollar. The key question is whether wider adoption can offset lower revenue per token.',
    analysis: 'Lower prices create a demand question before they establish an infrastructure winner.' },
];

export const PROFILES = {
  greg: { id: 'Greg Brockman', name: 'Greg Brockman', img: 'assets/social-greg.png', external: true },
  owner: { id: 'owner', name: 'YGGYLL', handle: '@yggyll', img: 'assets/social-owner.png', pro: true, owner: true,
    bio: 'Tracking momentum, breakouts and asymmetric risk across US tech and mid-cap alts.',
    channels: [['x', '@yggyll', 'https://x.com/yggyll'], ['telegram', '@YGGYLLSignals', 'https://t.me/YGGYLLSignals']], postKeys: ['P06', 'S05'] },
  maya: { id: 'maya', name: 'Maya Reynolds', role: 'Senior Analyst · Semis & Hardware', handle: '@maya', img: 'assets/feed-source-gavin-baker.png', pro: true,
    bio: 'Equity research on US semis and hyperscalers. I publish when the evidence changes.',
    channels: [['x', '@mayareynolds', 'https://x.com/mayareynolds'], ['telegram', '@MayaResearch', 'https://t.me/MayaResearch']], postKeys: ['P06', 'S05'] },
  chamath: { id: 'chamath', name: 'Chamath Palihapitiya', role: 'Founder & CEO, Social Capital', img: 'assets/social-chamath.png', external: true,
    bio: 'Long-horizon technology investor and former Facebook executive. Writes on AI infrastructure economics, capital discipline and index-level risk, and returns often to how compute costs reset software margins.', postKeys: ['S02', 'S05'] },
};
