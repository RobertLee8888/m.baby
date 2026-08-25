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
      seed: 91021, base: 208.4, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'Two thirds of the session’s volume printed in the first forty minutes, against a five-day average of one third. The move held its level afterwards rather than fading, which reads as positioning rather than a single order.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
    META: {
      sym: 'META', logo: A + 'feed-logo-meta.svg', tone: '▲ Bullish',
      co: 'Meta Platforms', mkt: 'NASDAQ', price: 742.18, chg: -6.02, pct: -0.8,
      pre: { price: 739.6, chg: -2.58, pct: -0.35, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 41773, base: 742.2, anomaly: {
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
      seed: 30559, base: 148.9, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Re-rating on distribution rather than earnings: the three-billion-download figure landed pre-open and the gap never filled. Volume ran at 2.1× the twenty-day median through the close.',
        when: 'Aug 25, 2026 · 20:58 GMT+8',
      },
    },
    AAOI: {
      sym: 'AAOI', logo: A + 'feed-logo-aaoi.svg', tone: '▲ Bullish',
      co: 'Applied Optoelectronics', mkt: 'NASDAQ', price: 32.17, chg: -4.06, pct: -11.21,
      pre: { price: 31.84, chg: -0.33, pct: -1.03, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 77213, base: 32.2, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Sell-side re-rating after the $600M at-the-market program was filed, helped by dilution math rather than any fresh market or sector lift. The second leg down came without a matching move in optical peers.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
  };

  const GOOG = TICKERS.GOOG, META = TICKERS.META, BABA = TICKERS.BABA, AAOI = TICKERS.AAOI;

  /* ──────────────────────────────
     Sources

     Simulated, but simulated from the card they belong to: every row is a
     source that could plausibly have produced that card's sentences, and
     the excerpt is the line the card is standing on.
     ────────────────────────────── */

  const SRC_DOWNLOADS = [
    { name: 'Bloomberg', handle: '@business', time: '2h ago', badge: 'x', img: A + 'alpha-source-bloomberg.png',
      quote: 'Alibaba’s open-weight Qwen family passed 3 billion cumulative downloads over the past six months, ahead of Meta’s Llama.' },
    { name: 'Reuters', handle: 'reuters.com', time: '3h ago', img: A + 'alpha-source-reuters.png',
      quote: 'Chinese open-source releases are being pulled into Western fine-tuning pipelines at a rate that surprised even their authors.' },
    { name: 'Alibaba Group', handle: 'Q1 FY27 earnings call', time: '1d ago', mono: 'BA',
      quote: 'Model distribution is now a first-order channel for the cloud business, not a marketing line.' },
    { name: 'Hugging Face', handle: 'Trending · August 2026', time: '6h ago', mono: 'HF',
      quote: 'Four of the ten most-downloaded text models this month are Qwen derivatives.' },
    { name: 'Jukan', handle: '@Jukanlosreve', time: '5h ago', badge: 'x', mono: 'JK',
      quote: 'Download counts are a proxy for mindshare, not revenue. Worth keeping the two apart.' },
    { name: 'The Information', handle: 'theinformation.com', time: '9h ago', mono: 'TI',
      quote: 'Meta has begun benchmarking its next open release against Qwen rather than against its own previous version.' },
    { name: 'r/LocalLLaMA', handle: 'Reddit thread', time: '11h ago', mono: 'r/',
      quote: 'The fine-tune ecosystem picked a favourite about a week in, and it has not moved since.' },
  ];

  const SRC_AAOI = [
    { name: 'SEC EDGAR', handle: 'AAOI · Form 424B5', time: '2h ago', mono: 'SE',
      quote: 'The company may offer and sell shares of common stock having an aggregate offering price of up to $600,000,000.' },
    { name: 'Applied Optoelectronics', handle: 'Press release', time: '2h ago', mono: 'AO',
      quote: 'Proceeds are intended for capacity expansion and general corporate purposes.' },
    { name: 'Dylan Patel', handle: '@dylan522p', time: '1h ago', badge: 'x', img: A + 'avatar-semianalysis.png',
      quote: 'A $600M ATM into this tape is a statement about capex, not about the quarter.' },
    { name: 'CNBC Television', handle: '@CNBC', time: '3h ago', badge: 'x', img: A + 'feed-avatar-src2.png',
      quote: 'Optical names gave back most of the AI-datacenter premium in a single session.' },
    { name: 'Barron’s', handle: 'barrons.com', time: '4h ago', mono: 'BA',
      quote: 'Dilution of roughly 18% at current prices, assuming the full program is used.' },
  ];

  const SRC_INFERENCE = [
    { name: 'Olivia Moore', handle: '@omooretweets', time: '4h ago', badge: 'x', img: A + 'feed-avatar-quote.png',
      quote: 'Many tasks may have reached diminishing returns on intelligence, and that is where the margin opportunity is.' },
    { name: 'a16z', handle: 'Podcast · ep. 214', time: '1d ago', mono: 'a16',
      quote: 'The interesting story this year is COGS, not list price.' },
    { name: 'Nebius', handle: 'Q2 FY26 earnings call', time: '2d ago', mono: 'NB',
      quote: 'Utilisation, not list price, is what shows up in our revenue line.' },
    { name: 'Palantir', handle: 'Q2 FY26 shareholder letter', time: '2d ago', mono: 'PL',
      quote: 'Lower inference cost lands in gross margin before it lands in price.' },
    { name: 'r/LocalLLaMA', handle: 'Reddit thread', time: '8h ago', mono: 'r/',
      quote: 'Everyone I know swapped to the cheap model and then tripled their call volume.' },
    { name: 'SemiAnalysis', handle: '@dylan522p', time: '10h ago', badge: 'x', img: A + 'avatar-semianalysis.png',
      quote: 'Serving revenue per model is up even though the headline price per million tokens is down.' },
  ];

  const SOURCES = [A + 'feed-avatar-src1.png', A + 'feed-avatar-src2.png', A + 'feed-avatar-src3.png'];

  const foot = (meta, sources) => ({ sources: SOURCES, meta: meta, automation: 'investor-roundtable', list: sources });

  const CARDS = [
    {
      tickers: [GOOG, META, BABA],
      blocks: [
        {
          type: 'text',
          text: "Alibaba Group Holding's open-weight AI models accumulated more than 3 billion global downloads during the past six months, according to Bloomberg and other reports. The figure surpassed reported downloads for models from Meta Platforms, Alphabet, and domestic peers, making Alibaba's models the world's most downloaded AI models.",
        },
        { type: 'mediaRow', items: [CHART_TILE, CHART_TILE, CHART_TILE] },
      ],
      foot: foot('5 sources · 1h ago', SRC_DOWNLOADS),
    },
    {
      tickers: [AAOI],
      blocks: [
        { type: 'lead', text: 'AAOI fell again after announcing a $600 million at-the-market equity-sale program' },
        {
          type: 'text',
          text: "A second sharp move today followed an earlier AAOI decline tied to the company's new equity-sale program. Applied Optoelectronics announced an agreement permitting up to $600 million in common-stock sales, raising dilution and share-supply concerns.  A weaker U.S. equity market added pressure at the margin.",
        },
        { type: 'media', src: CHART_WIDE },
      ],
      foot: foot('5 sources · 1h ago', SRC_AAOI),
    },
    {
      tickers: [GOOG, META, BABA],
      blocks: [
        { type: 'title', text: 'Cheaper Models Expand Inference Volume' },
        {
          type: 'quote',
          avatar: A + 'feed-avatar-quote.png',
          name: 'Olivia Moore',
          text: 'Many tasks may have reached diminishing returns on intelligence, that products may stop automatically switching to each new frontier model, and that this creates many opportunities for application builders to reduce COGS.',
        },
        {
          type: 'text',
          text: 'Cheaper adequate models can convert lower application COGS into more production inference rather than merely lower customer bills. NBIS is the strongest infrastructure expression because it directly captures the resulting model-serving utilization, while PLTR offers a distinct application-margin route but weaker direct exposure.',
        },
        { type: 'mediaRow', items: [CHART_CANDLES, CHART_CANDLES, CHART_CANDLES] },
      ],
      foot: foot('5 sources · 1h ago', SRC_INFERENCE),
    },
  ];

  /* What the pill brings in. Same grammar, fresher timestamps — the point
     of the pill is that the top of the feed moved, not that a new kind of
     card exists. */
  const NEW_CARDS = [
    {
      tickers: [AAOI],
      blocks: [
        { type: 'lead', text: 'AAOI opens the session 4% lower as the equity-sale program starts pricing' },
        { type: 'mediaRow', items: [CHART_TILE, CHART_TILE, CHART_TILE] },
      ],
      foot: foot('3 sources · just now', SRC_AAOI),
    },
    {
      tickers: [GOOG],
      blocks: [
        { type: 'title', text: 'Inference Demand Outruns Its Own Price Cuts' },
        {
          type: 'text',
          text: 'Token prices fell again this quarter, and usage rose faster than the cut — so serving revenue per model keeps climbing even as the headline price per million tokens drops.',
        },
        { type: 'media', src: CHART_WIDE },
      ],
      foot: foot('4 sources · 2m ago', SRC_INFERENCE),
    },
    {
      tickers: [META, BABA],
      blocks: [
        {
          type: 'text',
          text: 'Open-weight releases from both camps landed within a day of each other, and the download curves have the same shape: a flat first week, then a step change once the fine-tuning community picks a favourite.',
        },
        { type: 'mediaRow', items: [CHART_TILE, CHART_TILE, CHART_TILE] },
      ],
      foot: foot('6 sources · 5m ago', SRC_DOWNLOADS),
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
    text.appendChild(el('span', 'ticker-tone', t.tone));
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

    const lead = btn('foot-lead', 'Sources');
    const stack = el('div', 'sources');
    card.foot.sources.forEach(src => stack.appendChild(img(src)));
    lead.appendChild(stack);
    lead.appendChild(el('span', 'foot-meta', card.foot.meta));
    lead.addEventListener('click', e => { e.stopPropagation(); openSources(card); });
    footEl.appendChild(lead);

    const auto = el('div', 'automation');
    auto.appendChild(img(A + 'feed-dot-green.svg'));
    auto.appendChild(el('span', null, card.foot.automation));
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
    const stamps = ['just now', '2m ago'];
    return NEW_CARDS.slice(0, 2).map((card, i) => Object.assign({}, card, {
      foot: Object.assign({}, card.foot, { meta: card.foot.meta.split(' · ')[0] + ' · ' + stamps[i] }),
    }));
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
    }

    await springTo(0);
    spinner.classList.remove('spinning');
    spinner.style.opacity = '0';
    track.classList.remove('pulled');
    refreshing = false;

    if (!fresh.length) toast('You’re all caught up');
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
  const sheetScroll = document.getElementById('sheetScroll');

  let sheetOpen = false;
  let sheetTeardown = null;

  function openSheet(y, header, body, teardown) {
    closeSheet(true);
    sheet.style.setProperty('--sheet-y', y);
    sheetTop.replaceChildren(...header);
    sheetScroll.replaceChildren(...body);
    sheetScroll.scrollTop = 0;
    sheetTeardown = teardown || null;
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
      if (!sheetOpen) { sheetTop.replaceChildren(); sheetScroll.replaceChildren(); }
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
    const list = card.foot.list || [];
    const header = [sheetClose(), el('h2', null, 'Sources · ' + list.length)];
    openSheet('calc(var(--status-h) + 85px)', header, list.map(sourceRow));
  }

  /* ── Ticker sheet (957:18126) ── */

  const TK_TABS = ['Overview', 'Narratives', 'Anomalies', 'News & Social', 'Smart Events', 'Financials'];
  const followed = new Set(['GOOG', 'BABA']);   /* the two the Me screen counts */

  function starButton(t) {
    const b = btn('sheet-btn right', 'Follow ' + t.sym);
    const paint = () => {
      const on = followed.has(t.sym);
      b.replaceChildren(icon(on ? 'ui-star-f.svg' : 'ui-star-l.svg', on ? 'ic-star-f' : ''));
      b.setAttribute('aria-pressed', String(on));
    };
    paint();
    b.addEventListener('click', () => {
      if (followed.has(t.sym)) {
        followed.delete(t.sym);
        toast('Unfollowed ' + t.sym + ' — it will stop leading your feed');
      } else {
        followed.add(t.sym);
        toast('Following ' + t.sym + ' — new signals will reach you');
      }
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
    card.appendChild(el('span', 'anom-label', t.anomaly.label));
    card.appendChild(el('p', 'anom-body', t.anomaly.body));
    const f = el('div', 'anom-foot');
    f.appendChild(el('span', 'anom-when', t.anomaly.when));
    const more = btn('anom-more');
    more.appendChild(el('span', null, 'Show more'));
    more.appendChild(icon('ui-arrow-up-l2.svg'));
    more.addEventListener('click', () => toast('The full anomaly write-up is the Anomalies tab'));
    f.appendChild(more);
    card.appendChild(f);
    return card;
  }

  function openTicker(t) {
    const header = [sheetClose(), el('h2', null, ''), starButton(t)];
    const chart = chartModule(t);
    openSheet('calc(var(--status-h) + 47px)',
      header,
      [tkTabs(), tkName(t), chart.node, anomalyCard(t)],
      chart.dispose);
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
      candles.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.06 }, borderVisible: false });
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

    if (extras && extras.marker != null && LWC.createSeriesMarkers) {
      LWC.createSeriesMarkers(candles, [{
        time: data[extras.marker].time,
        position: 'belowBar',
        color: p.amber,
        shape: 'arrowUp',
        size: 1,
      }]);
    }

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

    const bar = el('div', 'chart-bar');
    const tf = el('div', 'tf');
    let tfIndex = 0;
    const tfButtons = TIMEFRAMES.map((name, i) => {
      const b = btn(i === 0 ? 'on' : '');
      b.textContent = name;
      b.addEventListener('click', () => {
        tfButtons.forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        tfIndex = i;
        redraw();
      });
      tf.appendChild(b);
      return b;
    });
    bar.appendChild(tf);

    const mode = el('span', 'chart-mode');
    mode.appendChild(el('span', null, '1m'));
    mode.appendChild(icon('ui-arrow-down-l2.svg'));
    bar.appendChild(mode);

    const tools = el('div', 'chart-tools');
    [['ui-chart-candles-l.svg', 'Candles'], ['ui-chart-indicators-l.svg', 'Indicators'],
     ['ui-chart-expand-l.svg', 'Fullscreen'], ['ui-chart-setting-l.svg', 'Chart settings']]
      .forEach(([file, label]) => {
        const b = btn('', label);
        b.appendChild(icon(file));
        b.addEventListener('click', () => {
          if (label === 'Fullscreen') openFullChart();
          else toast(label + ' is the next thing to build here');
        });
        tools.appendChild(b);
      });
    bar.appendChild(tools);
    node.appendChild(bar);

    /* The legend is the OHLC of whatever the crosshair is over, and the
       last bar when it is over nothing — which is how a chart says
       "these are the numbers you are looking at". */
    const legend = el('div', 'chart-legend');
    const dot = el('span', 'dot');
    legend.appendChild(dot);
    const cells = {};
    ['O', 'H', 'L', 'C'].forEach(k => {
      legend.appendChild(el('span', 'k', k));
      cells[k] = el('span', 'v');
      legend.appendChild(cells[k]);
    });
    const chgCell = el('span', 'v');
    legend.appendChild(chgCell);
    legend.appendChild(el('span', 'k', 'Volume'));
    const volCell = el('span', 'v up');
    legend.appendChild(volCell);
    node.appendChild(legend);

    const plot = el('div', 'plot');
    plot.style.height = '250px';
    node.appendChild(plot);

    let chart = null;
    let data = null;

    function paintLegend(bar_, volume) {
      const b = bar_ || { open: data[data.length - 1].open, high: data[data.length - 1].high,
        low: data[data.length - 1].low, close: data[data.length - 1].close };
      cells.O.textContent = money(b.open);
      cells.H.textContent = money(b.high);
      cells.L.textContent = money(b.low);
      cells.C.textContent = money(b.close);
      const d = b.close - b.open;
      chgCell.textContent = signed(d) + ' ' + pct((d / b.open) * 100);
      chgCell.className = 'v ' + (d >= 0 ? 'up' : 'down');
      const v = volume == null ? data[data.length - 1].volume : volume;
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
    app.classList.add('full');
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
    app.classList.remove('full');
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

  function showTab(name) {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    screens.forEach((screen, key) => screen.classList.toggle('current', key === name));
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
  render();
  wireRowDrag(cardsEl);
  fitPhone();
})();
