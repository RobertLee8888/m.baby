/* ═══════════════════════════════════════════════════════════
   MVP · For You feed
   Figma: Feed Mobile MVP · ⭐️ MVP · For You (1496:32177)

   The feed is data, not markup. A card is a header (one to three
   tickers), a stack of content blocks, and a footer — so a new card
   type is a new block type, and nothing else in this file moves.

   Block types, all straight from the Figma component:
     text      Markdown/M · Regular 14/22
     lead      Markdown/M · Medium 14/22   (the one-line "what happened")
     title     Markdown/M · Medium 16/26   (a named thesis)
     quote     Markdown - Quote            (speaker + passage)
     media     Media = 1                   gutter-to-gutter, 203 tall
     mediaRow  Media > 1                   240 × 135 tiles, scrolls right
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const A = 'assets/';
  const CHART_WIDE = A + 'feed-media-chart.png';
  const CHART_TILE = A + 'feed-media-chart-narrow.png';
  const CHART_CANDLES = A + 'feed-media-chart-candles.png';

  const GOOG = { logo: A + 'feed-logo-goog.svg', name: 'GOOG', tone: '▲ Bullish' };
  const META = { logo: A + 'feed-logo-meta.svg', name: 'META', tone: '▲ Bullish' };
  const BABA = { logo: A + 'feed-logo-baba.svg', name: 'BABA', tone: '▲ Bullish' };
  const AAOI = { logo: A + 'feed-logo-aaoi.svg', name: 'AAOI', tone: '▲ Bullish' };

  const SOURCES = [A + 'feed-avatar-src1.png', A + 'feed-avatar-src2.png', A + 'feed-avatar-src3.png'];

  const foot = (meta) => ({ sources: SOURCES, meta: meta, automation: 'investor-roundtable' });

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
      foot: foot('5 sources · 1h ago'),
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
      foot: foot('5 sources · 1h ago'),
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
      foot: foot('5 sources · 1h ago'),
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
      foot: foot('3 sources · just now'),
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
      foot: foot('4 sources · 2m ago'),
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
      foot: foot('6 sources · 5m ago'),
    },
  ];

  /* ──────────────────────────────
     Building a card
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

  function ticker(t) {
    const wrap = el('div', 'ticker');
    wrap.appendChild(img(t.logo, 'ticker-logo'));
    const text = el('div', 'ticker-text');
    text.appendChild(el('span', 'ticker-name', t.name));
    text.appendChild(el('span', 'ticker-tone', t.tone));
    wrap.appendChild(text);
    return wrap;
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

    if (b.type === 'media') {
      const m = el('div', 'media');
      m.appendChild(img(b.src));
      return m;
    }

    if (b.type === 'mediaRow') {
      const row = el('div', 'media-row');
      b.items.forEach(src => {
        const tile = el('div', 'media-tile');
        tile.appendChild(img(src));
        row.appendChild(tile);
      });
      return row;
    }

    return el('div');
  }

  function cardNode(card) {
    const node = el('article', 'card');

    const head = el('div', 'card-head');
    card.tickers.forEach((t, i) => {
      if (i) head.appendChild(el('span', 'head-rule'));
      head.appendChild(ticker(t));
    });
    node.appendChild(head);

    const body = el('div', 'card-body');
    card.blocks.forEach(b => body.appendChild(block(b)));
    node.appendChild(body);

    const footEl = el('div', 'card-foot');
    const lead = el('div', 'foot-lead');
    const stack = el('div', 'sources');
    card.foot.sources.forEach(src => stack.appendChild(img(src)));
    lead.appendChild(stack);
    lead.appendChild(el('span', 'foot-meta', card.foot.meta));
    footEl.appendChild(lead);

    const auto = el('div', 'automation');
    auto.appendChild(img(A + 'feed-dot-green.svg'));
    auto.appendChild(el('span', null, card.foot.automation));
    footEl.appendChild(auto);

    const ask = el('button', 'ask');
    ask.type = 'button';
    ask.setAttribute('aria-label', 'Ask Alva');
    ask.appendChild(img(A + 'feed-tab-chat.svg'));
    ask.addEventListener('click', e => {
      e.stopPropagation();
      toast('Ask Alva opens the thread in Chat — that screen is next');
    });
    footEl.appendChild(ask);

    node.appendChild(footEl);

    node.addEventListener('click', () => toast('Ticker detail is the next screen in the MVP'));
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
  let batch = 0;

  function render() {
    cardsEl.replaceChildren();
    CARDS.forEach(c => cardsEl.appendChild(cardNode(c)));
  }

  /* Every refresh has something to show: the same three cards come back
     around with a fresher timestamp, which is what a feed does. */
  function nextBatch() {
    batch += 1;
    const stamps = ['just now', '1m ago', '3m ago'];
    const take = 2 + (batch % 2);
    return NEW_CARDS.slice(0, take).map((card, i) => Object.assign({}, card, {
      foot: Object.assign({}, card.foot, { meta: card.foot.meta.split(' · ')[0] + ' · ' + stamps[i % stamps.length] }),
    }));
  }

  /* ── the pulled track ── */

  function setPull(y) {
    track.style.transform = y ? 'translate3d(0,' + y + 'px,0)' : '';
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

    /* The new cards land while the list is still held open, so they are
       already there when it closes — the list never jumps under the eye. */
    nextBatch().reverse().forEach(card => {
      const node = cardNode(card);
      node.classList.add('enter');
      cardsEl.insertBefore(node, cardsEl.firstElementChild);
    });

    await springTo(0);
    spinner.classList.remove('spinning');
    spinner.style.opacity = '0';
    refreshing = false;

    /* The feed keeps moving while you read it, so the pill comes back —
       far enough apart that it reads as news, not as a nag. */
    window.setTimeout(() => {
      pillText.textContent = (2 + (batch % 2)) + ' new feeds';
      setPill(true);
    }, 18000);
  }

  /* ── the gesture: touch, and a mouse drag so it works on a desktop too ── */

  let pulling = false;
  let pullStart = 0;
  let pullY = 0;

  const canPull = target => !refreshing && feed.scrollTop <= 0 && !(target.closest && target.closest('.media-row'));

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

  /* ── the pill ── */

  function setPill(show) {
    pill.classList.toggle('gone', !show);
  }

  pill.addEventListener('click', e => {
    e.preventDefault();
    refresh();
  });

  /* ──────────────────────────────
     Media rows: a sideways drag scrolls them on a desktop, where there is
     no finger to swipe with and the wheel belongs to the feed.
     ────────────────────────────── */

  function wireRowDrag(root) {
    root.querySelectorAll('.media-row').forEach(row => {
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
        /* a drag is not a tap: swallow the click that would open a card */
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

  function hideToast() {
    toastEl.classList.remove('show');
  }

  /* ──────────────────────────────
     Tabs
     ────────────────────────────── */

  const tabs = [...document.querySelectorAll('.tab')];
  const screens = new Map([...document.querySelectorAll('.screen')].map(s => [s.dataset.tab, s]));

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      screens.forEach((screen, key) => screen.classList.toggle('current', key === name));
      hideToast();
    });
  });

  /* ──────────────────────────────
     Restart (standalone) and the stage's Restart both land here
     ────────────────────────────── */

  function restart() {
    refreshing = false;
    batch = 0;
    setPull(0);
    spinner.classList.remove('spinning');
    spinner.style.opacity = '0';
    render();
    wireRowDrag(cardsEl);
    pillText.textContent = '3 new feeds';
    setPill(true);
    feed.scrollTop = 0;
    tabs.forEach((t, i) => t.setAttribute('aria-selected', String(i === 0)));
    screens.forEach((screen, key) => screen.classList.toggle('current', key === 'feed'));
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
    if (document.documentElement.classList.contains('embedded') || window.innerWidth <= 520) {
      phone.style.transform = '';
      return;
    }
    const scale = Math.min(1, (window.innerHeight - 48) / 884, (window.innerWidth - 80) / 425);
    phone.style.transform = 'scale(' + Math.max(0.45, scale) + ')';
  }

  window.addEventListener('resize', fitPhone);

  render();
  wireRowDrag(cardsEl);
  fitPhone();
})();
