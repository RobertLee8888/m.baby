/* ═══════════════════════════════════════════════════════════
   MVP — For You, Chat, Me, and the three overlays
   Figma: Feed Mobile MVP · ⭐️ MVP

   The feed is data, not markup. A card is a header (one to three
   tickers), a stack of content blocks, and a footer — so a new card
   type is a new block type, and nothing else in this file moves.

   Block types, all straight from the Figma component:
     text      Markdown/M · Regular 14/22
     lead      Markdown/M · Medium 14/22   (the one-line "what happened")
     title     Markdown/M · Medium 16/26   (a named thesis)
     quote     Markdown - Quote            (speaker + passage)
     media     Media = 1                   gutter-to-gutter, 240 × 135
     mediaRow  Media > 1                   240 × 135 tiles, scrolls right

   Three things in a card are doors, and each one opens the surface it
   points at rather than a toast:
     a ticker            → the ticker sheet   (957:18126)
     the sources row     → the sources sheet  (545:62549)
     any chart           → the fullscreen chart (1076:48248)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const A = 'assets/';
  const CHART_WIDE = A + 'feed-media-chart.png';
  const CHART_TILE = A + 'feed-media-chart-narrow.png';
  const CHART_CANDLES = A + 'feed-media-chart-candles.png';

  /* ──────────────────────────────
     Mode

     One switch, two modes, and the choice outlives the session. The
     stylesheet does the rest: nothing below this block knows which mode
     it is in, because every colour it uses is a variable.
     ────────────────────────────── */

  const THEME_KEY = 'alva-mvp-theme';
  const root = document.documentElement;

  function readTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function setTheme(mode) {
    root.dataset.theme = mode;
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* private window */ }
    const sw = document.getElementById('themeSwitch');
    if (sw) sw.setAttribute('aria-checked', String(mode === 'dark'));
    const btn = document.getElementById('themeButton');
    if (btn) btn.textContent = mode === 'dark' ? 'Light mode' : 'Dark mode';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#15161a' : '#ffffff');
    restyleCharts();
  }

  /* The chart is a canvas, so it cannot inherit a token — it has to be
     told. Reading the computed value keeps one source of truth: the
     stylesheet. */
  function token(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  /* ──────────────────────────────
     Tickers

     A ticker is the same object everywhere it appears: the chip in a card
     header, the header of its own sheet, and the series its chart draws.
     ────────────────────────────── */

  const TICKERS = {
    GOOG: {
      sym: 'GOOG', logo: A + 'feed-logo-goog.svg', tone: '▲ Bullish',
      co: 'Alphabet Inc', mkt: 'NASDAQ', price: 208.44, chg: 1.86, pct: 0.9,
      pre: { price: 209.1, chg: 0.66, pct: 0.32, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 91021, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'Two thirds of the session’s volume printed in the first forty minutes, against a five-day average of one third. The move held its level afterwards rather than fading, which reads as positioning rather than a single order.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
    META: {
      sym: 'META', logo: A + 'feed-logo-meta.svg', tone: '▼ Bearish',
      co: 'Meta Platforms', mkt: 'NASDAQ', price: 742.18, chg: -6.02, pct: -0.8,
      pre: { price: 739.6, chg: -2.58, pct: -0.35, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 41773, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A drift lower on no company news, tracking the open-weight download story rather than any change in guidance. Options skew barely moved, which argues against a fundamental re-rate.',
        when: 'Aug 25, 2026 · 21:12 GMT+8',
      },
    },
    BABA: {
      sym: 'BABA', logo: A + 'feed-logo-baba.svg', tone: '▲ Bullish',
      co: 'Alibaba Group', mkt: 'NYSE', price: 148.92, chg: 3.41, pct: 2.34,
      pre: { price: 149.75, chg: 0.83, pct: 0.56, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 30559, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Re-rating on distribution rather than earnings: the three-billion-download figure landed pre-open and the gap never filled. Volume ran at 2.1× the twenty-day median through the close.',
        when: 'Aug 25, 2026 · 20:58 GMT+8',
      },
    },
    AAOI: {
      sym: 'AAOI', logo: A + 'feed-logo-aaoi.svg', tone: '▼ Bearish',
      co: 'Applied Optoelectronics', mkt: 'NASDAQ', price: 32.17, chg: -4.06, pct: -11.21,
      pre: { price: 31.84, chg: -0.33, pct: -1.03, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 77213, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Sell-side re-rating after the $600M at-the-market program was filed, helped by dilution math rather than any fresh market or sector lift. The second leg down came without a matching move in optical peers.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
    AVGO: {
      sym: 'AVGO', logo: A + 'feed-logo-avgo.svg', tone: '▲ Bullish',
      co: 'Broadcom Inc', mkt: 'NASDAQ', price: 412.66, chg: 9.84, pct: 2.45,
      pre: { price: 414.2, chg: 1.54, pct: 0.37, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 60817, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'A 4% gap up on a supply-chain note, half of it given back by lunch, and volume that never came back down: 1.6× the twenty-day median with no closing imbalance. The tape says positioning, not one desk chasing a print.',
        when: 'Aug 25, 2026 · 22:04 GMT+8',
      },
    },
    AMD: {
      sym: 'AMD', logo: A + 'feed-logo-amd.svg', tone: '▲ Bullish',
      co: 'Advanced Micro Devices', mkt: 'NASDAQ', price: 187.3, chg: -3.12, pct: -1.64,
      pre: { price: 188.05, chg: 0.75, pct: 0.4, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 22409, anomaly: {
        label: 'Unusual Options Activity',
        body: 'Call volume in the front two expiries ran at three times open interest while the shares finished lower, which is the shape of a position being built into weakness rather than sold into strength.',
        when: 'Aug 25, 2026 · 21:33 GMT+8',
      },
    },
    MSFT: {
      sym: 'MSFT', logo: A + 'feed-logo-msft.svg', tone: '▲ Bullish',
      co: 'Microsoft Corp', mkt: 'NASDAQ', price: 521.44, chg: 1.98, pct: 0.38,
      pre: { price: 522.1, chg: 0.66, pct: 0.13, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 15493, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A quiet session in the shares while the names it buys silicon from moved several percent. When the buyer does not move and the suppliers do, the market is pricing the cost line rather than the demand line.',
        when: 'Aug 25, 2026 · 21:05 GMT+8',
      },
    },
  };

  const GOOG = TICKERS.GOOG, META = TICKERS.META, BABA = TICKERS.BABA, AAOI = TICKERS.AAOI;
  const AVGO = TICKERS.AVGO, AMD = TICKERS.AMD, MSFT = TICKERS.MSFT;

  /* ──────────────────────────────
     What kind of thing a card is

     The three cards in the Figma frame are not three layouts, they are three
     data types, and each one has its own grammar of blocks. That is what makes
     them tell apart at a glance in a scrolling list:

       event    a company event, read and analysed — one paragraph, then media.
                One ticker or several.
       anomaly  one name moving in a way that needs explaining — the one-line
                what happened, the why, and the chart. Exactly one ticker,
                because an anomaly belongs to a single tape.
       source   something a source published, tracked and analysed — the named
                thesis, the passage itself, the read, then media. One or
                several tickers.

     The automation in the footer is the playbook that found the card, so it
     follows from the type rather than being decoration.
     ────────────────────────────── */

  const AUTOMATION = {
    event: 'company-events',
    anomaly: 'unusual-moves',
    source: 'investor-roundtable',
  };

  /* ──────────────────────────────
     Sources

     Simulated, but simulated from the card they belong to: every row is a
     source that could plausibly have produced that card's sentences, and the
     excerpt is the line the card is standing on. Each card has its own list,
     and the list is the single source of truth — the count and the avatars in
     the footer are read off it, so the footer can never disagree with the
     sheet it opens.
     ────────────────────────────── */

  const AV = {
    bloomberg: A + 'alpha-source-bloomberg.png',
    reuters: A + 'alpha-source-reuters.png',
    tv: A + 'feed-avatar-src2.png',
    src1: A + 'feed-avatar-src1.png',
    src3: A + 'feed-avatar-src3.png',
    moore: A + 'feed-avatar-quote.png',
    semi: A + 'avatar-semianalysis.png',
    pod: A + 'alpha-source-podcast.png',
    p1: A + 'alpha-podcast-1.png',
    p3: A + 'alpha-podcast-3.png',
    f1: A + 'alpha-fintwit-1.png',
    f2: A + 'alpha-fintwit-2.png',
    f3: A + 'alpha-fintwit-3.png',
    f5: A + 'alpha-fintwit-5.png',
    f6: A + 'alpha-fintwit-6.png',
    f7: A + 'alpha-fintwit-7.png',
  };

  const x = (name, handle, time, avatar, quote) =>
    ({ name, handle, time, badge: 'x', img: avatar, quote });
  const org = (name, handle, time, mono, quote) => ({ name, handle, time, mono, quote });
  const pic = (name, handle, time, avatar, quote) => ({ name, handle, time, img: avatar, quote });

  /* 1 · Alibaba's open-weight downloads — 7 */
  const SRC_DOWNLOADS = [
    x('Bloomberg', '@business', '2h ago', AV.bloomberg,
      'Alibaba’s open-weight Qwen family passed 3 billion cumulative downloads over the past six months, ahead of Meta’s Llama.'),
    pic('Reuters', 'reuters.com', '3h ago', AV.reuters,
      'Chinese open-source releases are being pulled into Western fine-tuning pipelines at a rate that surprised even their authors.'),
    org('Alibaba Group', 'Q1 FY27 earnings call', '1d ago', 'BA',
      'Model distribution is now a first-order channel for the cloud business, not a marketing line.'),
    org('Hugging Face', 'Trending · August 2026', '6h ago', 'HF',
      'Four of the ten most-downloaded text models this month are Qwen derivatives.'),
    x('Weights & Moats', '@weightsandmoats', '5h ago', AV.f1,
      'Download counts are a proxy for mindshare, not revenue. Worth keeping the two apart.'),
    org('The Information', 'theinformation.com', '9h ago', 'TI',
      'Meta has begun benchmarking its next open release against Qwen rather than against its own previous version.'),
    org('r/LocalLLaMA', 'Reddit thread', '11h ago', 'r/',
      'The fine-tune ecosystem picked a favourite about a week in, and it has not moved since.'),
  ];

  /* 2 · AAOI's $600M at-the-market program — 5 */
  const SRC_AAOI = [
    org('SEC EDGAR', 'AAOI · Form 424B5', '2h ago', 'SE',
      'The company may offer and sell shares of common stock having an aggregate offering price of up to $600,000,000.'),
    org('Applied Optoelectronics', 'Press release', '2h ago', 'AO',
      'Proceeds are intended for capacity expansion and general corporate purposes.'),
    x('Optical Floor', '@opticalfloor', '1h ago', AV.f2,
      'A $600M ATM into this tape is a statement about capex, not about the quarter.'),
    x('CNBC Television', '@CNBC', '3h ago', AV.tv,
      'Optical names gave back most of the AI-datacenter premium in a single session.'),
    org('Barron’s', 'barrons.com', '4h ago', 'BA',
      'Dilution of roughly 18% at current prices, assuming the full program is used.'),
  ];

  /* 3 · Cheaper models, more inference — 6 */
  const SRC_INFERENCE = [
    x('Olivia Moore', '@omooretweets', '4h ago', AV.moore,
      'Many tasks may have reached diminishing returns on intelligence, and that is where the margin opportunity is.'),
    org('a16z', 'Podcast · ep. 214', '1d ago', 'a16',
      'The interesting story this year is COGS, not list price.'),
    org('Nebius', 'Q2 FY26 earnings call', '2d ago', 'NB',
      'Utilisation, not list price, is what shows up in our revenue line.'),
    org('Palantir', 'Q2 FY26 shareholder letter', '2d ago', 'PL',
      'Lower inference cost lands in gross margin before it lands in price.'),
    org('r/LocalLLaMA', 'Reddit thread', '8h ago', 'r/',
      'Everyone I know swapped to the cheap model and then tripled their call volume.'),
    x('Token Ledger', '@tokenledger', '10h ago', AV.f3,
      'Serving revenue per model is up even though the headline price per million tokens is down.'),
  ];

  /* 4 · Broadcom's fourth custom-accelerator customer — 4 */
  const SRC_XPU = [
    org('Broadcom', 'Q3 FY26 earnings call', '3h ago', 'AV',
      'Our AI accelerator backlog now extends four quarters, and it is customer-committed rather than forecast.'),
    org('SEC EDGAR', 'AVGO · Form 8-K', '3h ago', 'SE',
      'A fourth hyperscale customer has committed to a multi-generation custom accelerator program.'),
    pic('Reuters', 'reuters.com', '2h ago', AV.reuters,
      'Two people familiar with the schedule said first silicon is targeted for the second half of next year.'),
    x('Silicon Ledger', '@siliconledger', '4h ago', AV.f5,
      'Four committed XPU customers is the number that turns this from a project business into a product line.'),
  ];

  /* 5 · The AVGO gap that half-closed — 3 */
  const SRC_AVGO_POP = [
    x('HBM Watch', '@hbmwatch', '5h ago', AV.f6,
      'The note everyone traded was a restatement of the March allocation figures, not new guidance.'),
    x('Bloomberg', '@business', '4h ago', AV.bloomberg,
      'Broadcom shares gave back half an early gain after the supply-chain note was clarified.'),
    org('Nasdaq', 'Market activity', '3h ago', 'NQ',
      'Volume finished at 1.6× the twenty-day median with no closing imbalance.'),
  ];

  /* 6 · AMD's second customer for the same part — 9 */
  const SRC_SECOND_SOURCE = [
    x('Silicon Ledger', '@siliconledger', '6h ago', AV.f5,
      'A second source does not need to win the benchmark. It needs to exist at contract time.'),
    org('AMD', 'Q2 FY26 earnings call', '1d ago', 'AM',
      'MI-series revenue is now split across more than one hyperscale customer.'),
    org('Microsoft', 'Azure engineering blog', '2d ago', 'MS',
      'The inference fleet is deliberately dual-sourced for the next generation.'),
    org('The Information', 'theinformation.com', '8h ago', 'TI',
      'Azure’s second-source order is smaller than the headline but runs multi-year.'),
    pic('Reuters', 'reuters.com', '10h ago', AV.reuters,
      'Analysts read the deal as a validation of the software stack rather than of the silicon.'),
    x('Carry & Roll', '@carryandroll', '7h ago', AV.f7,
      'A second source is worth more to the buyer than to the seller. Price it from the buyer’s side.'),
    org('r/hardware', 'Reddit thread', '12h ago', 'r/',
      'The ROCm complaints in this thread are noticeably milder than a year ago.'),
    pic('Acquired', 'Podcast · ep. 191', '2d ago', AV.pod,
      'The whole second-source playbook is about removing a single point of failure from a supply chain.'),
    org('Barron’s', 'barrons.com', '1d ago', 'BA',
      'Gross-margin guidance implies the second-source pricing is not a giveaway.'),
  ];

  /* 7 · Alibaba's third consecutive cloud raise — 11 */
  const SRC_BABA_CLOUD = [
    org('Alibaba Group', 'Q1 FY27 earnings call', '5h ago', 'BA',
      'For the first time the raise is attributable to external model serving rather than to internal workloads.'),
    org('SEC EDGAR', 'BABA · Form 6-K', '5h ago', 'SE',
      'AI-related cloud revenue represented more than 20% of segment revenue, against approximately 10% a year earlier.'),
    x('Bloomberg', '@business', '6h ago', AV.bloomberg,
      'Third straight quarterly raise, and the first one management pinned on outside customers.'),
    pic('Reuters', 'reuters.com', '6h ago', AV.reuters,
      'Cloud growth outpaced the wider Chinese market for the fourth consecutive quarter.'),
    org('Caixin', 'caixinglobal.com', '7h ago', 'CX',
      'Domestic enterprises are standardising on the open weights and paying for the hosted endpoints.'),
    x('Weights & Moats', '@weightsandmoats', '8h ago', AV.f1,
      'Open weights are the acquisition channel. The cloud line is the revenue.'),
    org('South China Morning Post', 'scmp.com', '9h ago', 'SC',
      'Capacity additions in Zhangjiakou and Nantong were brought forward two quarters.'),
    x('CNBC Television', '@CNBC', '10h ago', AV.tv,
      'The guidance raise, not the print, is what the desk traded this morning.'),
    x('The Long Run', '@thelongrun', '11h ago', AV.f2,
      'Twenty percent of segment revenue from AI serving is the first number here that is hard to argue with.'),
    org('r/investing', 'Reddit thread', '14h ago', 'r/',
      'Everyone was watching the commerce line and the cloud line is what moved.'),
    pic('Invest Like the Best', 'Podcast · ep. 402', '2d ago', AV.p1,
      'Distribution first, monetisation second, is a strategy Western vendors abandoned too early.'),
  ];

  /* 8 · META's newsless drift — 8 */
  const SRC_META_DRIFT = [
    x('Bloomberg', '@business', '6h ago', AV.bloomberg,
      'Meta shares drifted lower through the session with no company-specific catalyst on the tape.'),
    org('Nasdaq', 'Market activity', '6h ago', 'NQ',
      'No block prints and no closing imbalance; the decline was spread evenly across the session.'),
    x('Token Ledger', '@tokenledger', '7h ago', AV.f3,
      'This is the download story being priced, one basis point at a time.'),
    org('The Information', 'theinformation.com', '8h ago', 'TI',
      'The next open release has slipped a quarter, according to two people involved.'),
    pic('Reuters', 'reuters.com', '9h ago', AV.reuters,
      'Sell-side notes published into the close reframed rather than downgraded.'),
    x('Open Weights', '@openweights_', '10h ago', AV.f6,
      'Llama derivatives are still the biggest family on the hub. Downloads are not the same as deployments.'),
    org('r/LocalLLaMA', 'Reddit thread', '11h ago', 'r/',
      'Half this thread has already moved to Qwen for fine-tuning and stayed on Llama for serving.'),
    org('Barron’s', 'barrons.com', '12h ago', 'BA',
      'Options skew is unchanged on the week, which argues against a re-rate.'),
  ];

  /* Refresh · AAOI's first tranche prices — 2 */
  const SRC_AAOI_PRICING = [
    org('SEC EDGAR', 'AAOI · 424B5 prospectus supplement', 'just now', 'SE',
      'The shares offered hereby are being sold at a price representing a discount to the last reported sale price.'),
    x('Optical Floor', '@opticalfloor', '3m ago', AV.f2,
      'First tranche is being marketed below last night’s close. That is the whole move this morning.'),
  ];

  /* Refresh · the fourth XPU customer gets a name — 1 */
  const SRC_AVGO_NAMED = [
    org('Broadcom', 'Press release', '2m ago', 'AV',
      'Broadcom and Google have extended their custom accelerator collaboration by two further generations.'),
  ];

  /* ──────────────────────────────
     The feed
     ────────────────────────────── */

  const CARDS = [
    {
      type: 'event',
      tickers: [GOOG, META, BABA],
      age: '1h ago',
      sources: SRC_DOWNLOADS,
      blocks: [
        {
          type: 'text',
          text: "Alibaba Group Holding's open-weight AI models accumulated more than 3 billion global downloads during the past six months, according to Bloomberg and other reports. The figure surpassed reported downloads for models from Meta Platforms, Alphabet, and domestic peers, making Alibaba's models the world's most downloaded AI models.",
        },
        { type: 'mediaRow', items: [CHART_TILE, CHART_TILE, CHART_TILE] },
      ],
    },
    {
      type: 'anomaly',
      tickers: [AAOI],
      age: '1h ago',
      sources: SRC_AAOI,
      blocks: [
        { type: 'lead', text: 'AAOI fell again after announcing a $600 million at-the-market equity-sale program' },
        {
          type: 'text',
          text: "A second sharp move today followed an earlier AAOI decline tied to the company's new equity-sale program. Applied Optoelectronics announced an agreement permitting up to $600 million in common-stock sales, raising dilution and share-supply concerns.  A weaker U.S. equity market added pressure at the margin.",
        },
        { type: 'media', src: CHART_WIDE },
      ],
    },
    {
      type: 'source',
      tickers: [GOOG, META, BABA],
      age: '2h ago',
      sources: SRC_INFERENCE,
      blocks: [
        { type: 'title', text: 'Cheaper Models Expand Inference Volume' },
        {
          type: 'quote',
          avatar: AV.moore,
          name: 'Olivia Moore',
          text: 'Many tasks may have reached diminishing returns on intelligence, that products may stop automatically switching to each new frontier model, and that this creates many opportunities for application builders to reduce COGS.',
        },
        {
          type: 'text',
          text: 'Cheaper adequate models can convert lower application COGS into more production inference rather than merely lower customer bills. NBIS is the strongest infrastructure expression because it directly captures the resulting model-serving utilization, while PLTR offers a distinct application-margin route but weaker direct exposure.',
        },
        { type: 'mediaRow', items: [CHART_CANDLES, CHART_CANDLES, CHART_CANDLES] },
      ],
    },
    {
      type: 'event',
      tickers: [AVGO, MSFT],
      age: '2h ago',
      sources: SRC_XPU,
      blocks: [
        {
          type: 'text',
          text: 'Broadcom told analysts its AI-accelerator backlog now extends four quarters out and is customer-committed rather than forecast, after a fourth hyperscaler signed a multi-generation custom-XPU program. The 8-K does not name the buyer, but the delivery window lines up with the next Fairwater build-out, and Azure has said its inference fleet is deliberately dual-sourced.',
        },
        { type: 'mediaRow', items: [CHART_CANDLES, CHART_TILE, CHART_CANDLES] },
      ],
    },
    {
      type: 'anomaly',
      tickers: [AVGO],
      age: '3h ago',
      sources: SRC_AVGO_POP,
      blocks: [
        { type: 'lead', text: 'AVGO gapped up 4% at the open and gave half of it back before lunch' },
        {
          type: 'text',
          text: 'The move started pre-market on a supply-chain note about HBM allocation, and faded once the sell-side clarified that the note restated March figures rather than adding guidance. What does not fit a pure headline pop is the volume: it finished at 1.6× the twenty-day median with no closing imbalance, which reads as positioning rather than one desk chasing a print.',
        },
        { type: 'media', src: CHART_WIDE },
      ],
    },
    {
      type: 'source',
      tickers: [AMD, MSFT],
      age: '4h ago',
      sources: SRC_SECOND_SOURCE,
      blocks: [
        { type: 'title', text: 'A Second Source Only Has To Exist' },
        {
          type: 'quote',
          avatar: AV.f5,
          name: '@siliconledger',
          text: 'A second source does not need to win the benchmark. It needs to exist at contract time — that is the whole trade, and it is worth more to the buyer than it is to the seller.',
        },
        {
          type: 'text',
          text: 'MI-series revenue is now split across more than one hyperscale customer, which moves the argument off benchmarks and onto contract structure. The Azure order is smaller than the headline suggests but runs multi-year, and gross-margin guidance implies the pricing is not a giveaway. AMD is the direct expression; MSFT is the buyer whose cost curve bends, which is the slower and less visible half of the same trade.',
        },
        { type: 'mediaRow', items: [CHART_TILE, CHART_CANDLES, CHART_TILE] },
      ],
    },
    {
      type: 'event',
      tickers: [BABA],
      age: '5h ago',
      sources: SRC_BABA_CLOUD,
      blocks: [
        {
          type: 'text',
          text: 'Alibaba raised its cloud-revenue guidance for the third consecutive quarter and, for the first time, attributed the raise to external model serving rather than to internal workloads. The 6-K puts AI-related cloud revenue past a fifth of segment revenue, against roughly a tenth a year ago, and management framed open-weight distribution as the acquisition channel that feeds it — the same story the download figures have been telling from the outside.',
        },
        { type: 'mediaRow', items: [CHART_TILE, CHART_CANDLES, CHART_TILE] },
      ],
    },
    {
      type: 'anomaly',
      tickers: [META],
      age: '6h ago',
      sources: SRC_META_DRIFT,
      blocks: [
        { type: 'lead', text: 'META drifted 1.4% lower all session with no company news to point at' },
        {
          type: 'text',
          text: 'No filing, no guidance change, and options skew unchanged on the week — the drift tracked the open-weight download story rather than anything Meta said. Sell-side notes published into the close reframed rather than downgraded. A session shaped like this one is usually positioning ahead of a narrative, not a re-rate of the business.',
        },
        { type: 'media', src: CHART_WIDE },
      ],
    },
  ];

  /* What the pill brings in. Same three types, same grammar, only fresher —
     and the newest items carry the fewest sources, because that is what new
     means: the story has not been picked up yet. */
  const NEW_CARDS = [
    {
      type: 'anomaly',
      tickers: [AAOI],
      age: 'just now',
      sources: SRC_AAOI_PRICING,
      blocks: [
        { type: 'lead', text: 'AAOI opens 4% lower as the equity-sale program starts pricing' },
        {
          type: 'text',
          text: 'The prospectus supplement went out overnight and the first tranche is being marketed at a discount to last night’s close. Nothing about the business changed between yesterday and this morning; what changed is the share count the market has to absorb.',
        },
        { type: 'media', src: CHART_WIDE },
      ],
    },
    {
      type: 'event',
      tickers: [AVGO, GOOG],
      age: '2m ago',
      sources: SRC_AVGO_NAMED,
      blocks: [
        {
          type: 'text',
          text: 'Broadcom named the fourth custom-accelerator customer this morning: Google, extending the existing TPU relationship by two further generations rather than adding a new logo. That makes the backlog figure less of a surprise and the customer concentration more of one.',
        },
        { type: 'mediaRow', items: [CHART_CANDLES, CHART_CANDLES, CHART_TILE] },
      ],
    },
  ];

  /* ──────────────────────────────
     Building blocks
     ────────────────────────────── */

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const img = (src, cls) => {
    const n = document.createElement('img');
    n.src = src;
    n.alt = '';
    if (cls) n.className = cls;
    return n;
  };

  /* A glyph is a mask over `currentColor`, so it takes the mode with it.
     One helper, because every icon in the app is made this way. */
  const icon = (file, cls) => {
    const n = el('span', 'ic' + (cls ? ' ' + cls : ''));
    n.style.setProperty('--ic', 'url(' + A + file + ')');
    n.setAttribute('aria-hidden', 'true');
    return n;
  };

  const btn = (cls, label) => {
    const n = el('button', cls);
    n.type = 'button';
    if (label) n.setAttribute('aria-label', label);
    return n;
  };

  const money = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signed = n => (n > 0 ? '+' : '−') + money(Math.abs(n));
  const pct = n => '(' + (n > 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%)';

  function tickerChip(t) {
    const wrap = btn('ticker', t.sym + ' detail');
    wrap.appendChild(img(t.logo, 'ticker-logo'));
    const text = el('div', 'ticker-text');
    text.appendChild(el('span', 'ticker-name', t.sym));
    /* The tone is Alva's stance on the name, not today's direction — the
       design puts ▲ Bullish on three tickers at once — so the colour follows
       the arrow rather than the tape. */
    text.appendChild(el('span', 'ticker-tone' + (t.tone.indexOf('\u25bc') === 0 ? ' down' : ''), t.tone));
    wrap.appendChild(text);
    wrap.addEventListener('click', e => { e.stopPropagation(); openTicker(t); });
    return wrap;
  }

  function chartTile(src, cls) {
    const tile = btn(cls, 'Open chart');
    tile.appendChild(img(src));
    tile.addEventListener('click', e => { e.stopPropagation(); openFullChart(); });
    return tile;
  }

  function block(b) {
    if (b.type === 'text') return el('p', 'blk-text', b.text);
    if (b.type === 'lead') return el('p', 'blk-text blk-lead', b.text);
    if (b.type === 'title') return el('p', 'blk-text blk-title', b.text);

    if (b.type === 'quote') {
      const q = el('div', 'quote');
      const head = el('div', 'quote-head');
      head.appendChild(img(b.avatar, 'quote-avatar'));
      head.appendChild(el('span', 'quote-name', b.name));
      q.appendChild(head);
      q.appendChild(el('p', 'quote-body', b.text));
      q.appendChild(el('span', 'quote-mark', '”'));
      return q;
    }

    if (b.type === 'media') return chartTile(b.src, 'media');

    if (b.type === 'mediaRow') {
      const row = el('div', 'media-row');
      b.items.forEach(src => row.appendChild(chartTile(src, 'media-tile')));
      return row;
    }

    return el('div');
  }

  function cardNode(card) {
    const node = el('article', 'card');

    const head = el('div', 'card-head');
    card.tickers.forEach((t, i) => {
      if (i) head.appendChild(el('span', 'head-rule'));
      head.appendChild(tickerChip(t));
    });
    node.appendChild(head);

    const body = el('div', 'card-body');
    card.blocks.forEach(b => body.appendChild(block(b)));
    node.appendChild(body);

    const footEl = el('div', 'card-foot');

    /* Both halves of the footer come off card.sources, so the count and the
       faces can never drift from the sheet the row opens. Three faces is what
       the design shows; the rest are behind the number. */
    const lead = btn('foot-lead', 'Sources');
    const stack = el('div', 'sources');
    card.sources.slice(0, 3).forEach(src => {
      if (src.img) stack.appendChild(img(src.img));
      /* One letter, not two: the faces overlap by 6 of their 18, so a second
         character lands under the next circle. The sheet has room for the
         full monogram; the stack does not. */
      else stack.appendChild(el('span', 'foot-mono', (src.mono || src.name).slice(0, 1)));
    });
    lead.appendChild(stack);
    const n = card.sources.length;
    lead.appendChild(el('span', 'foot-meta', n + (n === 1 ? ' source · ' : ' sources · ') + card.age));
    lead.addEventListener('click', e => { e.stopPropagation(); openSources(card); });
    footEl.appendChild(lead);

    const auto = el('div', 'automation');
    auto.appendChild(img(A + 'feed-dot-green.svg'));
    auto.appendChild(el('span', null, AUTOMATION[card.type] || AUTOMATION.event));
    footEl.appendChild(auto);

    const ask = btn('ask', 'Ask Alva');
    ask.appendChild(icon('ui-chat-ai-l.svg'));
    ask.addEventListener('click', e => {
      e.stopPropagation();
      showTab('chat');
      toast('Ask Alva picks the thread up in Chat');
    });
    footEl.appendChild(ask);

    node.appendChild(footEl);
    return node;
  }

  /* ──────────────────────────────
     The feed, and the pull that refreshes it

     Pull-to-refresh is the standing gesture on this screen: from the top of
     the list, a drag down moves the track, brings the spinner into view and
     — past 48 — commits. The pill is the same refresh with a number on it,
     so tapping it runs exactly the same sequence rather than a second one.
     ────────────────────────────── */

  const feed = document.getElementById('feed');
  const track = document.getElementById('feedTrack');
  const cardsEl = document.getElementById('cards');
  const spinner = document.getElementById('spinner');
  const pill = document.getElementById('newPill');
  const pillText = document.getElementById('newPillText');
  const toastEl = document.getElementById('toast');

  const PULL_MAX = 96;      /* how far the list can be dragged */
  const PULL_TRIGGER = 48;  /* past here, releasing commits the refresh */
  const PULL_REST = 64;     /* where the list sits while it loads */
  const SPIN_MS = 1150;     /* a few turns of the spinner before the list changes */

  let refreshing = false;
  let served = false;   /* the feed has one batch to give; after that it is caught up */

  function render() {
    cardsEl.replaceChildren();
    CARDS.forEach(c => cardsEl.appendChild(cardNode(c)));
  }

  /* There are two cards waiting, and only the first refresh gets them. Every
     refresh after that is the other half of the state a feed has to show:
     the spinner runs, nothing new comes back, and the list says so. */
  function nextBatch() {
    if (served) return [];
    served = true;
    return NEW_CARDS.slice();
  }

  /* Twitter's line: it marks the boundary once, where the reading stopped,
     and nothing moves it afterwards. */
  function seenLine() {
    const line = el('div', 'seen-line', 'You were here');
    line.dataset.seen = '1';
    return line;
  }

  function setPull(y) {
    track.style.transform = y ? 'translate3d(0,' + y + 'px,0)' : '';
    track.classList.toggle('pulled', y > 0);
    if (!spinner.classList.contains('spinning')) {
      spinner.style.opacity = Math.min(1, y / PULL_TRIGGER).toFixed(3);
      spinner.style.transform = 'rotate(' + (y * 4).toFixed(1) + 'deg)';
    }
  }

  function springTo(y) {
    return new Promise(resolve => {
      track.classList.add('springing');
      setPull(y);
      window.setTimeout(() => { track.classList.remove('springing'); resolve(); }, 430);
    });
  }

  const wait = ms => new Promise(r => window.setTimeout(r, ms));

  async function refresh() {
    if (refreshing) return;
    refreshing = true;

    setPill(false);
    hideToast();
    feed.scrollTop = 0;

    await springTo(PULL_REST);
    spinner.style.opacity = '1';
    spinner.style.transform = '';
    spinner.classList.add('spinning');

    await wait(SPIN_MS);

    const fresh = nextBatch();

    if (fresh.length) {
      /* The new cards land while the list is still held open, so they are
         already there when it closes — the list never jumps under the eye.
         The line goes in first, above what was already read. */
      if (!cardsEl.querySelector('[data-seen]')) {
        cardsEl.insertBefore(seenLine(), cardsEl.firstElementChild);
      }
      fresh.reverse().forEach(card => {
        const node = cardNode(card);
        node.classList.add('enter');
        cardsEl.insertBefore(node, cardsEl.firstElementChild);
      });
      spinner.classList.remove('spinning');
      spinner.style.opacity = '0';
      await springTo(0);
    } else {
      /* Nothing came back, so the answer goes where the question was asked:
         the spinner hands its place to the sentence, the sentence is readable
         for a second, and then the gutter closes. A toast at the other end of
         the screen would be answering somewhere else entirely. */
      spinner.classList.remove('spinning');
      spinner.style.opacity = '0';
      refreshNote.textContent = 'You’re all caught up';
      refreshNote.classList.add('show');
      await wait(1000);
      await springTo(0);
      refreshNote.classList.remove('show');
      refreshNote.textContent = '';
    }

    track.classList.remove('pulled');
    refreshing = false;
  }

  /* ── the gesture: touch, and a mouse drag so it works on a desktop too ── */

  let pulling = false;
  let pullStart = 0;
  let pullY = 0;

  const canPull = target => !refreshing && !sheetOpen && feed.scrollTop <= 0 &&
    !(target.closest && target.closest('.media-row'));

  function pullBegin(y, target) {
    if (!canPull(target)) return;
    pulling = true;
    pullStart = y;
    pullY = 0;
  }

  function pullMove(y) {
    if (!pulling) return false;
    const raw = y - pullStart;
    if (raw <= 0) { pullY = 0; setPull(0); return false; }
    /* resistance, so the list feels attached to the finger rather than free */
    pullY = Math.min(PULL_MAX, raw * 0.55);
    setPull(pullY);
    return true;
  }

  function pullEnd() {
    if (!pulling) return;
    pulling = false;

    /* a pull is not a tap: swallow the click that would open a card */
    if (pullY > 4) {
      const swallow = ev => { ev.stopPropagation(); ev.preventDefault(); };
      feed.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => feed.removeEventListener('click', swallow, { capture: true }), 400);
    }

    if (pullY >= PULL_TRIGGER) refresh();
    else springTo(0).then(() => { spinner.style.opacity = '0'; });
    pullY = 0;
  }

  feed.addEventListener('touchstart', e => {
    if (e.touches.length === 1) pullBegin(e.touches[0].clientY, e.target);
  }, { passive: true });

  feed.addEventListener('touchmove', e => {
    if (pullMove(e.touches[0].clientY) && e.cancelable) e.preventDefault();
  }, { passive: false });

  feed.addEventListener('touchend', pullEnd);
  feed.addEventListener('touchcancel', pullEnd);

  feed.addEventListener('mousedown', e => {
    if (e.button === 0) pullBegin(e.clientY, e.target);
  });
  window.addEventListener('mousemove', e => {
    if (pullMove(e.clientY)) e.preventDefault();
  });
  window.addEventListener('mouseup', pullEnd);

  function setPill(show) { pill.classList.toggle('gone', !show); }

  pill.addEventListener('click', e => { e.preventDefault(); refresh(); });

  /* ──────────────────────────────
     The topbar collapses with the scroll

     Twitter's rule, and iOS's before it: a large title is not chrome, it is
     the first thing in the list, so it leaves with the list. The title fades
     and lifts, and the bar gives back exactly the 34px line the title was
     sitting on — 58 down to 24, which is the 16 and 8 of padding that were
     always around it.

     The whole thing is one number written to a custom property, so the bar's
     height and the pill's position both follow from it and nothing has to be
     kept in sync by hand. Driving it straight off scrollTop (rather than off
     scroll direction) is what makes it reversible: scrolling back up
     re-opens the bar exactly as far as you came down.
     ────────────────────────────── */

  /* The bar's whole height, so it has finished closing exactly when it would
     have scrolled out of view. */
  const BAR_TRAVEL = 58;

  function paintBar() {
    const p = Math.min(1, Math.max(0, feed.scrollTop / BAR_TRAVEL));
    app.style.setProperty('--bar-p', p.toFixed(4));
  }

  feed.addEventListener('scroll', paintBar, { passive: true });

  /* ──────────────────────────────
     Media rows: a sideways drag scrolls them on a desktop, where there is
     no finger to swipe with and the wheel belongs to the feed.
     ────────────────────────────── */

  function wireRowDrag(rootEl) {
    rootEl.querySelectorAll('.media-row').forEach(row => {
      if (row.dataset.wired) return;
      row.dataset.wired = '1';

      let dragging = false;
      let startX = 0;
      let startLeft = 0;
      let moved = 0;

      row.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        dragging = true;
        moved = 0;
        startX = e.clientX;
        startLeft = row.scrollLeft;
        e.preventDefault();
      });

      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 3) row.classList.add('dragging');
        moved = Math.abs(dx);
        row.scrollLeft = startLeft - dx;
      });

      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        row.classList.remove('dragging');
        /* a drag is not a tap: swallow the click that would open the chart */
        if (moved > 4) {
          const swallow = ev => { ev.stopPropagation(); ev.preventDefault(); };
          row.addEventListener('click', swallow, { capture: true, once: true });
        }
      });
    });
  }

  const rowWatcher = new MutationObserver(() => wireRowDrag(cardsEl));
  rowWatcher.observe(cardsEl, { childList: true });

  /* ──────────────────────────────
     Toast
     ────────────────────────────── */

  let toastTimer = 0;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 2200);
  }

  function hideToast() { toastEl.classList.remove('show'); }

  /* ══════════════════════════════════════════════════════════
     Sheets

     One scrim and one sheet element, shared. Whichever sheet is open owns
     the body; closing it tears the body down, which is what lets the chart
     inside the ticker sheet be disposed of instead of leaking a canvas.
     ══════════════════════════════════════════════════════════ */

  const app = document.getElementById('mvpApp');
  const scrim = document.getElementById('scrim');
  const sheet = document.getElementById('sheet');
  const sheetTop = document.getElementById('sheetTop');
  const sheetBody = document.getElementById('sheetBody');

  let sheetOpen = false;
  let sheetTeardown = null;

  /* opts.full  — take the whole ceiling and lay the body out as a column with
                   one flexible row in it (the ticker sheet).
     opts.ruled — hairline under the topbar (the sources sheet). */
  function openSheet(header, nodes, opts) {
    const o = opts || {};
    closeSheet(true);
    sheet.classList.toggle('full', !!o.full);
    sheetTop.className = 'sheet-top' + (o.ruled ? ' ruled' : '');
    sheetBody.className = o.full ? 'tk-body' : 'sheet-scroll';
    sheetTop.replaceChildren(...header);
    sheetBody.replaceChildren(...nodes);
    sheetBody.scrollTop = 0;
    sheetTeardown = o.teardown || null;
    sheetOpen = true;
    sheet.setAttribute('aria-hidden', 'false');
    app.classList.add('dim');
    /* one frame, so the transform transition has a "from" to run out of */
    requestAnimationFrame(() => { scrim.classList.add('show'); sheet.classList.add('show'); });
  }

  function closeSheet(immediate) {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove('show');
    scrim.classList.remove('show');
    sheet.setAttribute('aria-hidden', 'true');
    app.classList.remove('dim');
    const done = () => {
      if (sheetTeardown) { sheetTeardown(); sheetTeardown = null; }
      if (!sheetOpen) { sheetTop.replaceChildren(); sheetBody.replaceChildren(); }
    };
    if (immediate) done(); else window.setTimeout(done, 420);
  }

  scrim.addEventListener('click', () => closeSheet());

  function sheetClose() {
    const b = btn('sheet-btn', 'Close');
    b.appendChild(icon('close-l1.svg'));
    b.addEventListener('click', () => closeSheet());
    return b;
  }

  /* ── Sources sheet (545:62549) ── */

  function sourceRow(s) {
    const row = el('div', 'src');

    const head = el('div', 'src-head');
    const av = el('span', 'src-av');
    if (s.img) av.appendChild(img(s.img));
    else av.appendChild(el('span', 'src-mono', s.mono || s.name.slice(0, 2)));
    if (s.badge === 'x') {
      const badge = el('span', 'src-badge');
      badge.appendChild(icon('ui-social-x.svg'));
      av.appendChild(badge);
    }
    head.appendChild(av);

    const id = el('span', 'src-id');
    id.appendChild(el('span', 'src-name', s.name));
    id.appendChild(el('span', 'src-handle', s.handle));
    head.appendChild(id);

    head.appendChild(el('span', 'src-time', s.time));

    const open = btn('src-open');
    open.textContent = 'View original';
    open.addEventListener('click', () => toast('The original opens outside Alva'));
    head.appendChild(open);

    row.appendChild(head);
    row.appendChild(el('p', 'src-quote', s.quote));
    return row;
  }

  function openSources(card) {
    const list = card.sources || [];
    const header = [sheetClose(), el('h2', null, 'Sources · ' + list.length)];
    openSheet(header, list.map(sourceRow), { ruled: true });
  }

  /* ── Ticker sheet (957:18126) ── */

  const TK_TABS = ['Overview', 'Narratives', 'Anomalies', 'News & Social', 'Smart Events',
    'Filings', 'Options', 'Ownership', 'Peers'];
  const followed = new Set(['GOOG', 'BABA']);   /* the two the Me screen counts */

  function starButton(t) {
    const b = btn('sheet-btn right', 'Follow ' + t.sym);
    const paint = () => {
      const on = followed.has(t.sym);
      b.replaceChildren(icon(on ? 'ui-star-f.svg' : 'ui-star-l.svg', on ? 'ic-star-f' : ''));
      b.setAttribute('aria-pressed', String(on));
    };
    paint();
    /* The star is its own feedback — it goes solid and amber. A toast on top
       of that is the same news twice. */
    b.addEventListener('click', () => {
      if (followed.has(t.sym)) followed.delete(t.sym);
      else followed.add(t.sym);
      paint();
      const count = document.getElementById('followCount');
      if (count) count.textContent = String(followed.size);
    });
    return b;
  }

  function tkTabs() {
    const nav = el('nav', 'strip strip-inline');
    TK_TABS.forEach((name, i) => {
      const b = btn('strip-item' + (i === 0 ? ' on' : ''));
      b.textContent = name;
      b.addEventListener('click', () => {
        nav.querySelectorAll('.strip-item').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        if (i) toast(name + ' is the next tab to be built');
      });
      nav.appendChild(b);
    });
    return nav;
  }

  function tkName(t) {
    const wrap = el('div', 'tk-name');

    const co = el('div', 'tk-co');
    co.appendChild(img(t.logo));
    co.appendChild(el('b', null, t.co));
    co.appendChild(el('span', null, t.sym + ' · ' + t.mkt));
    wrap.appendChild(co);

    wrap.appendChild(el('div', 'tk-when', t.when));

    const price = el('div', 'tk-price');
    price.appendChild(el('b', null, '$' + money(t.price)));
    const dir = t.chg >= 0 ? 'up' : 'down';
    price.appendChild(el('span', 'tk-chg ' + dir, signed(t.chg) + ' ' + pct(t.pct)));
    wrap.appendChild(price);

    const pre = el('div', 'tk-pre');
    pre.appendChild(el('span', null, 'Pre-Market '));
    pre.appendChild(el('b', null, '$' + money(t.pre.price)));
    pre.appendChild(el('span', 'tk-chg ' + (t.pre.chg >= 0 ? 'up' : 'down'),
      ' ' + signed(t.pre.chg) + ' ' + pct(t.pre.pct)));
    pre.appendChild(el('span', null, ' · ' + t.pre.when));
    wrap.appendChild(pre);

    return wrap;
  }

  function anomalyCard(t) {
    const card = el('div', 'anom');
    card.appendChild(el('div', 'anom-label', t.anomaly.label));
    const sec = el('div', 'anom-sec');
    sec.appendChild(el('p', 'anom-body', t.anomaly.body));
    const f = el('div', 'anom-foot');
    f.appendChild(el('span', 'anom-when', t.anomaly.when));
    const more = btn('anom-more');
    more.appendChild(el('span', null, 'Show more'));
    more.appendChild(icon('ui-arrow-up-l2.svg'));
    more.addEventListener('click', () => toast('The full anomaly write-up is the Anomalies tab'));
    f.appendChild(more);
    sec.appendChild(f);
    card.appendChild(sec);
    return card;
  }

  function openTicker(t) {
    const header = [sheetClose(), el('h2', null, ''), starButton(t)];
    const chart = chartModule(t);
    openSheet(header, [tkTabs(), tkName(t), chart.node, anomalyCard(t)],
      { full: true, teardown: chart.dispose });
    chart.mount();
  }

  /* ══════════════════════════════════════════════════════════
     Charts

     TradingView's Lightweight Charts, vendored into assets/vendor. It is
     the same library the design's chart module was drawn from — candles,
     a volume pane, a right-hand price scale and labelled price lines are
     all things it already does properly, and a hand-rolled canvas would
     only be a worse version of it. What is ours is the styling: every
     colour it draws with is read out of the stylesheet, so the chart
     changes mode with everything else.

     The data is generated, but generated deterministically — a small LCG
     seeded per ticker — so the same ticker always draws the same session
     and nothing shifts under the eye between openings.
     ══════════════════════════════════════════════════════════ */

  const LWC = window.LightweightCharts || null;
  const live = new Set();   /* charts currently mounted, for restyling */

  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }

  const T0 = Date.UTC(2026, 7, 25, 1, 30, 0) / 1000;

  /* A plain session: noise around the number in the header, with the volume
     tracking the size of each bar rather than being independent of it. The
     series is generated first and then scaled so its last close *is* the
     price the header quotes — a chart that disagrees with the number above
     it is worse than no chart. The net change steers the drift, so a red
     day slopes down and a green one up. */
  function sessionSeries(seed, target, bars, spread, netPct) {
    const r = rng(seed);
    const drift = ((netPct || 0) / 100) / bars;
    const out = [];
    let px = 100;
    for (let i = 0; i < bars; i++) {
      const o = px;
      const c = o * (1 + drift + (r() - 0.5) * spread);
      const hi = Math.max(o, c) * (1 + r() * spread * 0.45);
      const lo = Math.min(o, c) * (1 - r() * spread * 0.45);
      const move = Math.abs(c - o) / o;
      out.push({
        time: T0 + i * 60,
        open: o, high: hi, low: lo, close: c,
        volume: Math.round(2200 + r() * 3800 + move * 900000),
      });
      px = c;
    }
    const k = target / out[out.length - 1].close;
    out.forEach(d => { d.open *= k; d.high *= k; d.low *= k; d.close *= k; });
    return out;
  }

  /* The session the fullscreen chart is about: flat, a leg down on the
     news, then a base. The design's three price lines only mean anything
     against a shape like this one. */
  function eventSeries(seed) {
    const r = rng(seed);
    const out = [];
    let px = 124.9;
    const bars = 112;
    for (let i = 0; i < bars; i++) {
      const falling = i >= 24 && i < 54;
      const drift = falling ? -0.0043 : (i >= 54 ? 0.00035 : -0.00012);
      const spread = falling ? 0.0105 : 0.0042;
      const o = px;
      const c = Math.max(1, o * (1 + drift + (r() - 0.5) * spread));
      const hi = Math.max(o, c) * (1 + r() * spread * 0.7);
      const lo = Math.min(o, c) * (1 - r() * spread * 0.7);
      out.push({
        time: T0 + i * 300,
        open: o, high: hi, low: lo, close: c,
        volume: Math.round((falling ? 26000 : 9000) + r() * (falling ? 46000 : 12000)),
      });
      px = c;
    }
    return out;
  }

  function chartPalette() {
    return {
      bg: token('--b10') || '#ffffff',
      text: token('--chart-axis'),
      grid: token('--chart-grid'),
      up: token('--m3') || '#2a9b7d',
      down: token('--m4') || '#e05357',
      volUp: token('--chart-vol-up'),
      volDown: token('--chart-vol-down'),
      m1: token('--m1') || '#49a3a6',
      m2: token('--m2') || '#2196f3',
      amber: token('--amber') || '#e6a91a',
      line: token('--l12'),
      ink: token('--nr10') || '#ffffff',
    };
  }

  function baseOptions(p) {
    return {
      layout: {
        background: { type: 'solid', color: p.bg },
        textColor: p.text,
        fontFamily: "'Delight', -apple-system, 'Helvetica Neue', Arial, sans-serif",
        fontSize: 11,
        attributionLogo: true,
        panes: { enableResize: false, separatorColor: p.line, separatorHoverColor: p.line },
      },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      rightPriceScale: { borderVisible: false, entireTextOnly: true },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 1 },
      crosshair: {
        mode: LWC ? LWC.CrosshairMode.Normal : 0,
        vertLine: { color: p.text, width: 1, style: 3, labelBackgroundColor: p.m1 },
        horzLine: { color: p.text, width: 1, style: 3, labelBackgroundColor: p.m1 },
      },
      handleScale: { axisPressedMouseMove: false },
      /* The design is in English throughout, and the library otherwise dates the
         crosshair in the viewer's own locale — which puts a Chinese month into
         an English chart. Pin it. */
      localization: { locale: 'en-US' },
    };
  }

  function candleColors(p) {
    return {
      upColor: p.up, downColor: p.down,
      wickUpColor: p.up, wickDownColor: p.down,
      borderUpColor: p.up, borderDownColor: p.down,
      borderVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    };
  }

  /* A mounted chart keeps its own restyle closure, so flipping the mode
     re-reads the tokens instead of rebuilding the canvas.

     `split` is the one structural difference between the two charts in the
     app: inside the ticker sheet there is only 250px to work with and the
     volume is an overlay at the foot of the price pane, the way the design
     draws it; fullscreen there is room for the second pane the design
     draws there instead. */
  function mountChart(host, data, extras) {
    if (!LWC) {
      host.appendChild(el('p', 'src-quote', 'The chart library did not load.'));
      return { restyle() {}, dispose() {} };
    }
    const split = !!(extras && extras.split);
    const p = chartPalette();
    const chart = LWC.createChart(host, Object.assign(baseOptions(p), {
      width: host.clientWidth || 393,
      height: host.clientHeight || 250,
    }));

    const candles = chart.addSeries(LWC.CandlestickSeries, candleColors(p), 0);
    candles.setData(data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));

    const volOpts = {
      priceFormat: { type: 'volume' },
      color: p.up,
      priceLineVisible: false,
      lastValueVisible: false,
    };
    if (!split) volOpts.priceScaleId = 'vol';
    const vol = chart.addSeries(LWC.HistogramSeries, volOpts, split ? 1 : 0);
    const volBars = q => data.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? q.volUp : q.volDown,
    }));
    vol.setData(volBars(p));

    /* The volume's own tag. A last-value label would take the colour of
       whichever way the final bar went, and in the design this label is
       always the accent — so it is an explicit line instead. */
    const volLine = vol.createPriceLine({
      price: data[data.length - 1].volume,
      color: p.up,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      axisLabelTextColor: '#ffffff',
      title: '',
    });

    if (split) {
      /* The design gives the price roughly three and a half times the
         height of the volume — enough that the volume reads as a second
         instrument rather than a strip of decoration. */
      const panes = chart.panes();
      if (panes[0]) panes[0].setStretchFactor(3.4);
      if (panes[1]) panes[1].setStretchFactor(1);
      /* More room above the highest print than a chart normally needs, so the
         previous-close line lands where the design has it — below the close
         button rather than under it. */
      candles.priceScale().applyOptions({ scaleMargins: { top: 0.22, bottom: 0.06 }, borderVisible: false });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.18, bottom: 0.02 }, borderVisible: false });
    } else {
      candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 }, borderVisible: false });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 }, borderVisible: false });
    }

    const lines = [];
    (extras && extras.lines ? extras.lines : []).forEach(cfg => {
      lines.push({
        cfg,
        ref: candles.createPriceLine({
          price: cfg.price,
          color: p[cfg.tone],
          lineWidth: 1,
          lineStyle: cfg.solid ? 0 : 2,
          axisLabelVisible: true,
          axisLabelTextColor: cfg.tone === 'amber' ? '#15161a' : '#ffffff',
          title: cfg.title || '',
        }),
      });
    });

    const marks = [];
    if (extras && extras.marker != null) {
      marks.push({
        time: data[extras.marker].time,
        position: 'belowBar',
        color: p.amber,
        shape: 'arrowUp',
        size: 1,
      });
    }
    if (extras && extras.badge) {
      /* The design draws a circle with a B inside it. Lightweight Charts puts
         marker text outside the shape, not in it, so this is the circle
         without the letter — a stray B hanging under a dot reads worse than
         no letter at all. A custom series renderer is what it would take. */
      marks.push({
        time: data[Math.min(data.length - 1, extras.badge.at)].time,
        position: 'inBar',
        color: p.up,
        shape: 'circle',
        size: 1,
      });
    }
    if (marks.length && LWC.createSeriesMarkers) LWC.createSeriesMarkers(candles, marks);

    if (extras && extras.onCrosshair) {
      chart.subscribeCrosshairMove(param => {
        const bar = param && param.seriesData ? param.seriesData.get(candles) : null;
        const v = param && param.seriesData ? param.seriesData.get(vol) : null;
        extras.onCrosshair(bar || null, v ? v.value : null);
      });
    }

    /* Fit once the element has its real width, and again whenever it
       changes — otherwise the first paint lands on the placeholder width
       and the session ends up cropped. */
    const fit = () => chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: host.clientWidth, height: host.clientHeight });
      fit();
    });
    ro.observe(host);
    requestAnimationFrame(fit);

    const entry = {
      restyle() {
        const q = chartPalette();
        chart.applyOptions(baseOptions(q));
        candles.applyOptions(candleColors(q));
        vol.applyOptions({ color: q.up });
        vol.setData(volBars(q));
        volLine.applyOptions({ color: q.up });
        lines.forEach(l => l.ref.applyOptions({ color: q[l.cfg.tone] }));
      },
      dispose() {
        live.delete(entry);
        ro.disconnect();
        chart.remove();
      },
    };
    live.add(entry);
    return entry;
  }

  function restyleCharts() { live.forEach(c => c.restyle()); }

  /* ── Chart/Entity: the module inside the ticker sheet ── */

  const TIMEFRAMES = ['1H', '4H', '1D', '1W', '1M'];

  function chartModule(t) {
    const node = el('div', 'chart-mod');

    /* Toolbar: the quick ranges, then the interval as a dropdown — the design
       boxes the interval, not the range, because the interval is the thing
       with a menu behind it. */
    const bar = el('div', 'chart-bar');
    const tf = el('div', 'tf');
    let tfIndex = 2;
    const tfButtons = TIMEFRAMES.map((name, i) => {
      const b2 = btn(i === tfIndex ? 'on' : '');
      b2.textContent = name;
      b2.addEventListener('click', () => {
        tfButtons.forEach(x => x.classList.remove('on'));
        b2.classList.add('on');
        tfIndex = i;
        redraw();
      });
      tf.appendChild(b2);
      return b2;
    });
    bar.appendChild(tf);

    const mode = btn('chart-mode', 'Interval');
    mode.appendChild(el('span', null, '1m'));
    mode.appendChild(icon('ui-arrow-down-l2.svg'));
    mode.addEventListener('click', () => toast('The interval menu is the next thing to build here'));
    bar.appendChild(mode);

    const tools = el('div', 'chart-tools');
    [['ui-chart-candles-l.svg', 'Candles'], ['ui-chart-indicators-l.svg', 'Indicators'],
     ['ui-chart-expand-l.svg', 'Fullscreen'], ['ui-chart-setting-l.svg', 'Chart settings']]
      .forEach(([file, label]) => {
        const b2 = btn('', label);
        b2.appendChild(icon(file));
        b2.addEventListener('click', () => {
          if (label === 'Fullscreen') openFullChart();
          else toast(label + ' is the next thing to build here');
        });
        tools.appendChild(b2);
      });
    bar.appendChild(tools);
    node.appendChild(bar);

    /* The legend is the OHLC of whatever the crosshair is over, and the last
       bar when it is over nothing — which is how a chart says "these are the
       numbers you are looking at". Volume gets its own line, as in the design. */
    const legend = el('div', 'chart-legend');
    legend.appendChild(el('span', 'dot'));
    const cells = {};
    ['O', 'H', 'L', 'C'].forEach(k => {
      legend.appendChild(el('span', 'k', k));
      cells[k] = el('span', 'v');
      legend.appendChild(cells[k]);
    });
    const chgCell = el('span', 'v');
    legend.appendChild(chgCell);
    node.appendChild(legend);

    const volRow = el('div', 'chart-vol');
    volRow.appendChild(el('span', 'k', 'Volume'));
    const volCell = el('span', 'v up');
    volRow.appendChild(volCell);
    node.appendChild(volRow);

    const plot = el('div', 'plot');
    const collapse = btn('plot-collapse', 'Collapse chart');
    collapse.appendChild(icon('ui-arrow-up-l2.svg'));
    collapse.addEventListener('click', () => toast('Collapsing the chart is the next thing to build here'));
    plot.appendChild(collapse);
    node.appendChild(plot);

    let chart = null;
    let data = null;

    function paintLegend(bar_, volume) {
      const last = data[data.length - 1];
      const b2 = bar_ || last;
      cells.O.textContent = money(b2.open);
      cells.H.textContent = money(b2.high);
      cells.L.textContent = money(b2.low);
      cells.C.textContent = money(b2.close);
      const d = b2.close - b2.open;
      chgCell.textContent = signed(d) + ' ' + pct((d / b2.open) * 100);
      chgCell.className = 'v ' + (d >= 0 ? 'up' : 'down');
      const v = volume == null ? last.volume : volume;
      volCell.textContent = (v / 1000).toFixed(2) + ' K';
    }

    function redraw() {
      if (chart) chart.dispose();
      const bars = [120, 96, 78, 64, 52][tfIndex];
      const spread = [0.0035, 0.0048, 0.0065, 0.009, 0.012][tfIndex];
      data = sessionSeries(t.seed + tfIndex * 977, t.price, bars, spread, t.pct);
      const last = data[data.length - 1].close;
      chart = mountChart(plot, data, {
        lines: [{ price: last, tone: 'up', solid: true }],
        /* the buy mark the design puts on the tape */
        badge: { at: Math.round(bars * 0.42), text: 'B' },
        onCrosshair: paintLegend,
      });
      paintLegend(null, null);
    }

    return {
      node,
      mount() { redraw(); },
      dispose() { if (chart) chart.dispose(); chart = null; },
    };
  }

  /* ── The fullscreen chart (1076:48248) ── */

  const fs = document.getElementById('fullChart');
  const fsPlot = document.getElementById('fsPlot');
  const fsClose = document.getElementById('fsClose');
  let fsChart = null;

  function openFullChart() {
    if (fsChart) fsChart.dispose();
    fs.classList.add('show');
    fs.setAttribute('aria-hidden', 'false');
    const data = eventSeries(51217);
    /* The three numbers the design labels, in the order they matter:
       where the day started from, what the event printed at, where it is. */
    fsChart = mountChart(fsPlot, data, {
      lines: [
        { price: 124.87, tone: 'amber', title: 'Previous close' },
        { price: 112.69, tone: 'm2', title: 'Event price' },
        { price: data[data.length - 1].close, tone: 'up', solid: true },
      ],
      split: true,
      marker: 52,
    });
  }

  function closeFullChart() {
    fs.classList.remove('show');
    fs.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => { if (fsChart) { fsChart.dispose(); fsChart = null; } }, 320);
  }

  fsClose.addEventListener('click', closeFullChart);

  /* Escape closes whatever is on top — the chart first, then a sheet. */
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (fs.classList.contains('show')) closeFullChart();
    else if (sheetOpen) closeSheet();
  });

  /* ──────────────────────────────
     Tabs
     ────────────────────────────── */

  const tabs = [...document.querySelectorAll('.tab')];
  const screens = new Map([...document.querySelectorAll('.screen')].map(s => [s.dataset.tab, s]));

  const TAB_ORDER = ['feed', 'chat', 'me'];
  const tabBar = document.getElementById('tabBar');

  function showTab(name) {
    const at = TAB_ORDER.indexOf(name);
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    screens.forEach((screen, key) => {
      screen.classList.toggle('current', key === name);
      /* Where this screen sits on the track, in screen-widths from the one
         being shown. The transition on the transform does the sliding. */
      screen.style.setProperty('--sx', String(TAB_ORDER.indexOf(key) - at));
    });
    /* Chat's composer already draws the edge above the tab bar. */
    tabBar.classList.toggle('flat', name === 'chat');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      closeSheet();
      hideToast();
      showTab(tab.dataset.tab);
    });
  });

  /* Everything on Chat and Me that points at a screen nobody has built yet
     says so once, in a toast, instead of doing nothing at all. */
  document.querySelectorAll('[data-hint]').forEach(node => {
    node.addEventListener('click', () => toast(node.dataset.hint));
  });

  /* ──────────────────────────────
     The mode switch, in two places: the Me screen (where a person would
     look for it) and the stage (where whoever is reviewing the prototype
     would).
     ────────────────────────────── */

  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
      setTheme(readTheme() === 'dark' ? 'light' : 'dark');
      toast(readTheme() === 'dark' ? 'Dark mode on' : 'Dark mode off');
    });
  }
  const themeButton = document.getElementById('themeButton');
  if (themeButton) themeButton.addEventListener('click', () => setTheme(readTheme() === 'dark' ? 'light' : 'dark'));

  /* ──────────────────────────────
     Restart (standalone) and the stage's Restart both land here
     ────────────────────────────── */

  function restart() {
    refreshing = false;
    served = false;
    closeSheet(true);
    closeFullChart();
    setPull(0);
    spinner.classList.remove('spinning');
    spinner.style.opacity = '0';
    followed.clear();
    followed.add('GOOG');
    followed.add('BABA');
    const count = document.getElementById('followCount');
    if (count) count.textContent = String(followed.size);
    render();
    wireRowDrag(cardsEl);
    pillText.textContent = '2 new feeds';
    setPill(true);
    feed.scrollTop = 0;
    paintBar();
    showTab('feed');
    hideToast();
  }

  const restartButton = document.getElementById('restartButton');
  if (restartButton) restartButton.addEventListener('click', restart);

  /* ──────────────────────────────
     Standalone: fit the mockup to the window
     ────────────────────────────── */

  function fitPhone() {
    const phone = document.getElementById('phone');
    if (!phone) return;
    if (root.classList.contains('embedded') || window.innerWidth <= 520) {
      phone.style.transform = '';
      return;
    }
    const scale = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth - 80) / 425);
    phone.style.transform = 'scale(' + Math.max(0.45, scale) + ')';
  }

  window.addEventListener('resize', fitPhone);

  setTheme(readTheme());
  /* The screens live on a track now, so their places have to be assigned
     before the first paint — otherwise all three sit at translateX(0) and the
     last one in the document wins. */
  showTab('feed');
  render();
  wireRowDrag(cardsEl);
  paintBar();
  fitPhone();
})();
