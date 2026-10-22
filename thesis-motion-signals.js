// Representative approved signals read from the reference's Signals tab.
// These are static demo snapshots, not a live monitoring feed.
export const SIGNALS = {
  P07: [{
    name: 'prnewswire.com', role: 'News publication', time: '14 Aug, 21:00',
    text: 'Pony.ai and Uber announced an expanded partnership covering plans to deploy more than 2,000 robotaxis across Europe and to extend the joint-deployment model into the Middle East, with further rollout details to be announced in phases.',
    url: 'https://www.prnewswire.com/news-releases/ponyai-and-uber-expand-partnership-to-deploy-over-2-000-robotaxis-in-europe-302850985.html',
    verdict: 'Supports',
    analysis: 'The added Middle East rollout provides incremental evidence that autonomous fleets may have a broader path to commercial scale, but it does not yet demonstrate owned fleet economics, utilization or sub-two-year payback.',
  }],
  P02: [{
    name: 'Ophir Gottlieb', role: 'CEO @CMLviz (Capital Market Laboratories)', time: '13 Aug, 08:00',
    text: 'CBRS is becoming less of a hardware company and more of an inference cloud \u2026 operate the machine and repeatedly sell its output',
    url: 'https://x.com/OphirGottlieb/status/2087675247147491689', verdict: 'Mixed',
    analysis: "Cerebras's reported shift toward recurring inference services supports the value-chain expansion mechanism, but does not show that NVIDIA captures comparable hosted-service economics.",
  }],
  S02: [{
    name: '@wholemars', role: 'News publication', time: '13 Aug, 02:00',
    text: "The @wholemars account reported that Tesla's latest Robotaxi app update lets riders queue for the next available car instead of seeing only a high-service-demand message.",
    url: 'https://x.com/wholemars/status/2087575001931338001', verdict: 'Supports',
    analysis: 'Reducing the effort required to obtain a Robotaxi could improve service usability and support future mobility adoption, but this update does not show actual utilization or transport economics.',
  }],
  S04: [{
    name: 'Cointelegraph', role: 'News publication', time: '14 Aug, 03:00',
    text: "Cointelegraph reported that Standard Chartered said Robinhood's integration with Uniswap could address a key liquidity challenge for a new blockchain and accelerate UNI token burns.",
    url: 'https://cointelegraph.com/news/robinhood-chain-uniswap-liquidity-uni-burns', verdict: 'Supports',
    analysis: "The reported integration could improve Robinhood's onchain liquidity and make its platform more useful, but the evidence is an analyst assessment rather than proof of realized liquidity or incremental users.",
  }],
  P01: [{
    name: 'blogs.nvidia.com', role: 'News publication', time: '12 Aug, 20:00',
    avatar: 'assets/feed-logo-nvda-real.png',
    text: 'NVIDIA said its 800 VDC architecture specifications had attracted more than 80 companies and were forming an open-standard supply chain for AI factories.',
    url: 'https://blogs.nvidia.com/blog/800-vdc-power-architecture-ai-factory/', verdict: 'Supports',
    analysis: "The emerging 800 VDC ecosystem could strengthen NVIDIA's full-system position by extending its architecture into data-center power design, although adoption and NVIDIA's direct economics remain unproven.",
  }],
};
