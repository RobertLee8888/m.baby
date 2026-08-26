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
     The names

     Ten of these carry the numbers Alva's own production feed was quoting on
     the morning of 26 August 2026 — last price, day change, and the six-week
     high and low the Alpha Radar chart labels. `lo`/`hi` are the range the
     ticker sheet quotes; the feed's tiles are the design's own two pictures
     and do not claim to be drawn from them. The remaining names (META, BABA,
     AAOI, AVGO, AMD, NBIS, PLTR) belong to the simulated event and anomaly
     cards, or to a batch the page did not price, and carry plausible numbers
     instead.
     ────────────────────────────── */

  const TICKERS = {
    TSM: {
      sym: 'TSM', logo: A + 'feed-logo-tsm.png', stance: 'bull',
      co: 'Taiwan Semiconductor', mkt: 'NYSE', price: 417.41, chg: 7.3, pct: 1.78,
      lo: 383.93, hi: 429.39,
      pre: { price: 418.9, chg: 1.49, pct: 0.36, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 51217, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Two separate advanced-node pricing reports landed inside the same session and the bid never faded, which is what a scarcity story looks like on the tape rather than a headline being faded.',
        when: 'Aug 26, 2026 · 10:58 GMT+8',
      },
    },
    GOOGL: {
      sym: 'GOOGL', logo: A + 'feed-logo-goog.svg', stance: 'bull',
      co: 'Alphabet Inc', mkt: 'NASDAQ', price: 346.96, chg: -1.11, pct: -0.32,
      lo: 320.69, hi: 373.78,
      pre: { price: 347.6, chg: 0.64, pct: 0.18, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 91021, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'Two thirds of the session’s volume printed in the first forty minutes, against a five-day average of one third. The move held its level afterwards rather than fading, which reads as positioning rather than a single order.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
    SMTC: {
      sym: 'SMTC', logo: A + 'feed-logo-smtc.png', stance: 'bull',
      co: 'Semtech Corp', mkt: 'NASDAQ', price: 127.52, chg: 6.61, pct: 5.47,
      lo: 107.31, hi: 147.65,
      pre: { price: 128.4, chg: 0.88, pct: 0.69, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 24408, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A 5.5% session on a beat that was mostly guidance: revenue $341.9M against roughly $329M expected, and unit forecasts raised from 50M to 80–90M. The move came in two legs with no closing imbalance, which is a re-rate rather than a squeeze.',
        when: 'Aug 26, 2026 · 09:59 GMT+8',
      },
    },
    FRO: {
      sym: 'FRO', logo: A + 'feed-logo-fro.png', stance: 'bull',
      co: 'Frontline plc', mkt: 'NYSE', price: 43.46, chg: -0.59, pct: -1.34,
      lo: 36.71, hi: 44.08,
      pre: { price: 43.6, chg: 0.14, pct: 0.32, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 66190, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'The tape gave back 1.3% on volume a third above the twenty-day median, into a week where 365 VLCCs have changed hands year to date against 239 in the whole of last year. Secondhand buying that heavy usually shows up in rates before it shows up in the quote.',
        when: 'Aug 26, 2026 · 09:59 GMT+8',
      },
    },
    RVMD: {
      sym: 'RVMD', logo: A + 'feed-logo-rvmd.png', stance: 'bull',
      co: 'Revolution Medicines', mkt: 'NASDAQ', price: 211.38, chg: -0.19, pct: -0.09,
      lo: 181.63, hi: 214.93,
      pre: { price: 212.1, chg: 0.72, pct: 0.34, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 38471, anomaly: {
        label: 'Unusual Options Activity',
        body: 'Call open interest three months out doubled on a flat session, concentrated in strikes a quarter above spot. Preclinical readouts do not usually move a tape, but they do move the options that pay if a readout lands.',
        when: 'Aug 26, 2026 · 08:58 GMT+8',
      },
    },
    NVDA: {
      sym: 'NVDA', logo: A + 'feed-logo-nvda.png', stance: 'bull',
      co: 'NVIDIA Corp', mkt: 'NASDAQ', price: 213.05, chg: 4.57, pct: 2.19,
      lo: 192.42, hi: 225.16,
      pre: { price: 214.2, chg: 1.15, pct: 0.54, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 70335, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A 2.2% session with no product news, tracking a research post about a 27-billion-parameter model running on a desktop appliance. The bid arrived in the last two hours and held into the close.',
        when: 'Aug 26, 2026 · 08:58 GMT+8',
      },
    },
    CDNS: {
      sym: 'CDNS', logo: A + 'feed-logo-cdns.png', stance: 'bull',
      co: 'Cadence Design Systems', mkt: 'NASDAQ', price: 331.9, chg: 15.98, pct: 5.06,
      lo: 314.95, hi: 371.5,
      pre: { price: 333.4, chg: 1.5, pct: 0.45, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 12984, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Five percent off a six-week base, and its closest peer moved with it rather than against it. When two names in a duopoly re-rate together the market is pricing the category, not the share split.',
        when: 'Aug 26, 2026 · 06:58 GMT+8',
      },
    },
    SNPS: {
      sym: 'SNPS', logo: A + 'feed-logo-snps.png', stance: 'bull',
      co: 'Synopsys Inc', mkt: 'NASDAQ', price: 408.79, chg: 14.28, pct: 3.62,
      lo: 374.33, hi: 425.28,
      pre: { price: 410.2, chg: 1.41, pct: 0.34, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 85520, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'Volume ran 1.8× the twenty-day median with the move front-loaded into the first hour, alongside a matching move in the other emulation vendor. Paired flow like this is usually a basket, not a stock picker.',
        when: 'Aug 26, 2026 · 06:58 GMT+8',
      },
    },
    MSFT: {
      sym: 'MSFT', logo: A + 'feed-logo-msft.svg', stance: 'flat',
      co: 'Microsoft Corp', mkt: 'NASDAQ', price: 491.71, chg: 4.39, pct: 0.9,
      lo: 383.16, hi: 504.4,
      pre: { price: 492.6, chg: 0.89, pct: 0.18, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 15493, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A quiet session in the shares while the names it buys silicon from moved several percent. When the buyer does not move and the suppliers do, the market is pricing the cost line rather than the demand line.',
        when: 'Aug 25, 2026 · 21:05 GMT+8',
      },
    },
    CBRS: {
      sym: 'CBRS', logo: A + 'feed-logo-cbrs.svg', stance: 'none',
      co: 'Cerebras Systems', mkt: 'NASDAQ', price: 183.92, chg: -1.52, pct: -0.82,
      lo: 175.18, hi: 250.39,
      pre: { price: 184.7, chg: 0.78, pct: 0.42, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 47762, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Down a quarter from the six-week high and still 5% above the low, on a session where the customer everyone is watching said the demand was there but not how much of it. A range this wide is the market disagreeing with itself about scale.',
        when: 'Aug 26, 2026 · 04:57 GMT+8',
      },
    },
    META: {
      sym: 'META', logo: A + 'feed-logo-meta.svg', stance: 'bear',
      co: 'Meta Platforms', mkt: 'NASDAQ', price: 742.18, chg: -6.02, pct: -0.8,
      lo: 688.4, hi: 781.6,
      pre: { price: 739.6, chg: -2.58, pct: -0.35, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 41773, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A drift lower on no company news, tracking the open-weight download story rather than any change in guidance. Options skew barely moved, which argues against a fundamental re-rate.',
        when: 'Aug 25, 2026 · 21:12 GMT+8',
      },
    },
    BABA: {
      sym: 'BABA', logo: A + 'feed-logo-baba.svg', stance: 'bull',
      co: 'Alibaba Group', mkt: 'NYSE', price: 148.92, chg: 3.41, pct: 2.34,
      lo: 121.05, hi: 152.7,
      pre: { price: 149.75, chg: 0.83, pct: 0.56, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 30559, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Re-rating on distribution rather than earnings: the three-billion-download figure landed pre-open and the gap never filled. Volume ran at 2.1× the twenty-day median through the close.',
        when: 'Aug 25, 2026 · 20:58 GMT+8',
      },
    },
    AAOI: {
      sym: 'AAOI', logo: A + 'feed-logo-aaoi.svg', stance: 'bear',
      co: 'Applied Optoelectronics', mkt: 'NASDAQ', price: 32.17, chg: -4.06, pct: -11.21,
      lo: 30.94, hi: 48.3,
      pre: { price: 31.84, chg: -0.33, pct: -1.03, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 77213, anomaly: {
        label: 'Unusual Price Movement',
        body: 'Sell-side re-rating after the $600M at-the-market program was filed, helped by dilution math rather than any fresh market or sector lift. The second leg down came without a matching move in optical peers.',
        when: 'Aug 25, 2026 · 21:47 GMT+8',
      },
    },
    AVGO: {
      sym: 'AVGO', logo: A + 'feed-logo-avgo.svg', stance: 'bull',
      co: 'Broadcom Inc', mkt: 'NASDAQ', price: 412.66, chg: 9.84, pct: 2.45,
      lo: 356.2, hi: 428.9,
      pre: { price: 414.2, chg: 1.54, pct: 0.37, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 60817, anomaly: {
        label: 'Unusual Volume Concentration',
        body: 'A 4% gap up on a supply-chain note, half of it given back by lunch, and volume that never came back down: 1.6× the twenty-day median with no closing imbalance. The tape says positioning, not one desk chasing a print.',
        when: 'Aug 25, 2026 · 22:04 GMT+8',
      },
    },
    AMD: {
      sym: 'AMD', logo: A + 'feed-logo-amd.svg', stance: 'flat',
      co: 'Advanced Micro Devices', mkt: 'NASDAQ', price: 187.3, chg: -3.12, pct: -1.64,
      lo: 162.4, hi: 199.8,
      pre: { price: 188.05, chg: 0.75, pct: 0.4, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 88431, anomaly: {
        label: 'Unusual Options Activity',
        body: 'Call volume in the front two expiries ran at three times the twenty-day average while the shares finished lower, which is a positioning trade around the second-source story rather than a view on the print.',
        when: 'Aug 25, 2026 · 21:33 GMT+8',
      },
    },
    NBIS: {
      sym: 'NBIS', logo: A + 'feed-logo-nbis.png', stance: 'bull',
      co: 'Nebius Group', mkt: 'NASDAQ', price: 96.44, chg: 4.18, pct: 4.53,
      lo: 61.7, hi: 103.85,
      pre: { price: 97.2, chg: 0.76, pct: 0.79, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 51903, anomaly: {
        label: 'Unusual Price Movement',
        body: 'A GPU-cloud name taking the whole of an inference-volume story: up on no filing of its own, on volume that ran through the close. The range is the widest in the group, which is what a capacity bet looks like before the capacity is booked.',
        when: 'Aug 25, 2026 · 21:26 GMT+8',
      },
    },
    PLTR: {
      sym: 'PLTR', logo: A + 'feed-logo-pltr.png', stance: 'flat',
      co: 'Palantir Technologies', mkt: 'NASDAQ', price: 214.07, chg: -1.36, pct: -0.63,
      lo: 168.9, hi: 236.4,
      pre: { price: 213.4, chg: -0.67, pct: -0.31, when: 'Aug 25, 20:45 GMT+8' },
      when: 'At Close · Aug 25, 04:00 GMT+8',
      seed: 66214, anomaly: {
        label: 'Unusual Options Activity',
        body: 'Front-expiry calls at twice the twenty-day average into a flat close: the application-margin route to the same story, priced by people who want the option rather than the exposure.',
        when: 'Aug 25, 2026 · 22:18 GMT+8',
      },
    },
  };

  const TSM = TICKERS.TSM, GOOGL = TICKERS.GOOGL, SMTC = TICKERS.SMTC, FRO = TICKERS.FRO;
  const RVMD = TICKERS.RVMD, NVDA = TICKERS.NVDA, CDNS = TICKERS.CDNS, SNPS = TICKERS.SNPS;
  const MSFT = TICKERS.MSFT, CBRS = TICKERS.CBRS;
  const META = TICKERS.META, BABA = TICKERS.BABA, AAOI = TICKERS.AAOI;
  const AVGO = TICKERS.AVGO, AMD = TICKERS.AMD;
  const NBIS = TICKERS.NBIS, PLTR = TICKERS.PLTR;

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

     The automation in the meta row is the playbook that found the card, so it
     follows from the type rather than being decoration — except where the card
     came from a named playbook of its own, which the real Alpha Radar batches
     did, and those carry their own name.

     The action in the footer follows from the type too, and this is the part
     the new frame gets right: an event is a name to start watching, an anomaly
     is a move you want measured against what you hold, and a source is a
     thesis you want taken further. One label each, because the card already
     knows which question is worth asking.
     ────────────────────────────── */

  const AUTOMATION = {
    event: 'company-events',
    anomaly: 'unusual-moves',
    source: 'investor-roundtable',
  };

  const ASK = {
    event: 'Track This',
    anomaly: "What's my impact",
    source: 'Dig Deeper',
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

  /* Every source has a face, and every face is a real image: the outlet's own
     mark, the company's own logo when the company is the one talking, or the
     account's avatar. No monograms — a letter in a circle is what you put
     there when you have not decided who the source is. The company logos are
     the same files the ticker chips use, which is also the right answer: a
     Form 8-K row should look like the company that filed it.

     One face, one account, everywhere: the nine portrait avatars are bound to
     the nine people the Alpha Radar batches actually quote, and the two
     simulated handles that survive on the event and anomaly cards get the two
     that are left. Nobody wears somebody else's face. */
  const AV = {
    bloomberg: A + 'alpha-source-bloomberg.png',
    reuters: A + 'alpha-source-reuters.png',
    cnn: A + 'feed-avatar-src2.png',
    semi: A + 'avatar-semianalysis.png',
    llama: A + 'alpha-ready-avatar-1.png',
    hf: A + 'src-hf.svg',

    /* Brands that speak in their own name, in their own mark. */
    dwarkesh: A + 'alpha-podcast-3.png',
    pplx: A + 'src-perplexity.svg',
    openai: A + 'src-openai.svg',

    tsm: A + 'feed-logo-tsm.png',
    googl: A + 'feed-logo-goog.svg',
    smtc: A + 'feed-logo-smtc.png',
    cdns: A + 'feed-logo-cdns.png',
    snps: A + 'feed-logo-snps.png',
    baba: A + 'feed-logo-baba.svg',
    aaoi: A + 'feed-logo-aaoi.svg',
    avgo: A + 'feed-logo-avgo.svg',
    amd: A + 'feed-logo-amd.svg',
    msft: A + 'feed-logo-msft.svg',

    nbis: A + 'feed-logo-nbis.png',
    pltr: A + 'feed-logo-pltr.png',
    nvda: A + 'feed-logo-nvda.png',
    fro: A + 'feed-logo-fro.png',
    rvmd: A + 'feed-logo-rvmd.png',

    /* The ten people the batches quote. */
    jukan: A + 'alpha-fintwit-3.png',
    sundar: A + 'alpha-podcast-8.png',
    alea: A + 'alpha-fintwit-1.png',
    marhelm: A + 'alpha-fintwit-6.png',
    biomaven: A + 'alpha-fintwit-2.png',
    saranormous: A + 'alpha-ready-avatar-4.png',
    kindig: A + 'feed-avatar-quote.png',
    tibo: A + 'alpha-fintwit-7.png',
    /* An illustrated face, not a photograph: the batch quotes a real person by
       name, and a stock portrait of somebody else beside that name would be
       the one wrong kind of placeholder. */
    olivia: A + 'alpha-podcast-2.png',

    /* The simulated handles. Clearly fictional accounts, because the event and
       anomaly cards are written for this prototype and a made-up sentence
       cannot go in a real person's mouth. */
    weights: A + 'alpha-fintwit-5.png',
    dilute: A + 'alpha-ready-avatar-3.png',
    tanker: A + 'alpha-ready-avatar-2.png',
    flowdesk: A + 'alpha-fintwit-4.png',
    edabench: A + 'alpha-podcast-4.png',
    trialdesk: A + 'alpha-podcast-5.png',
  };

  /* A source is either a voice on somebody else's platform or a publisher on
     its own channel, and that is the whole rule for the badge. An account on
     X, a show on a podcast feed, a channel on YouTube, a subreddit — each
     shows the channel's own avatar with the platform's mark on the corner. An
     outlet publishing on its own site, a company filing, an earnings call: no
     badge, because there is no third party to name. CNN's X account gets the
     X mark; cnn.com does not.

     The platform is read off the handle rather than typed in beside it, so a
     source cannot say "Podcast · Aug 25" and wear the wrong mark. */
  const PLATFORM = [
    [/podcast/i,        'podcast'],
    [/youtube/i,        'youtube'],
    [/reddit|^r\//i,    'reddit'],
    [/(^|[\s·])X([\s·]|$)|^@/, 'x'],
  ];
  const platformOf = handle => {
    for (const [re, name] of PLATFORM) if (re.test(handle)) return name;
    return null;
  };
  const BADGE = {
    x: 'ui-social-x.svg',
    podcast: 'ui-social-podcast.svg',
    youtube: 'ui-social-youtube.svg',
    reddit: 'ui-social-reddit.svg',
  };

  const src = (name, handle, time, avatar, quote) =>
    ({ name, handle, time, badge: platformOf(handle), img: avatar, quote });

  /* ──────────────────────────────
     Sources

     For the ten Alpha Radar cards these are not simulated: they are the
     passages Alva's own hourly batches were standing on, quoted as they were
     published, and they are the same objects the card's quote blocks render.
     One list per card, and the list is the single source of truth — the count
     and the avatars in the footer, the blocks in the body, and the rows in
     the sheet are all read off it, so none of the three can drift.

     Which is also why the counts here are 1 and 2 rather than 7 and 11: an
     hourly batch stands on the one or two passages it found, and inflating
     that with invented corroboration would be the opposite of what the sheet
     is for. The event and anomaly cards are simulated, and those do carry the
     wider lists a worked-up story would have.
     ────────────────────────────── */

  /* ── The ten Alpha Radar batches, 26 August 2026 ── */

  const S_DWARKESH_GW = src('Dwarkesh Podcast', 'Podcast · Aug 25', '1h ago', AV.dwarkesh,
    "OpenAI and Anthropic are estimated to have grown from roughly 2 gigawatts each or less at the start of the year to above 5 gigawatts by year-end, accounting for about 30% of added compute. Based on signed capacity, they could take 40%-50% of next year's compute and half of incremental compute by the end of next year; if the trend continues, they could control most usable global flops by late 2028, though reaching 100 gigawatts may require paying $25-$50 million per megawatt.");

  const SRC_TSM_CUSTOM = [
    S_DWARKESH_GW,
    src('@jukan05', 'X · Aug 26', '1h ago', AV.jukan,
      'Even when it comes to the semiconductors that form the foundation of AI. What Jalapeño made me realize is just how much lower the barrier to chip design is going to become. Using Codex with GPT-Astra, the team brought three open-weight models that were not part of Jalapeño’s original production plan to high performance within two months.'),
  ];

  const SRC_GOOGL_GEMINI = [
    src('Sundar Pichai', '@sundarpichai', '1h ago', AV.sundar,
      "Today, we're introducing industry-specific solutions on Gemini Enterprise, starting with Gemini Enterprise for Legal and Financial Services, with more industries to come. Gemini Enterprise for Legal is designed for law firms and in-house legal teams to help find and synthesize information, and navigate complex matters more efficiently. It has four capabilities →"),
  ];

  const SRC_SMTC_16T = [
    src('@aleabitoreddit', 'X · Aug 26', '2h ago', AV.alea,
      'Availability currently matters more than pricing, with no near-term erosion expected on booked optical orders as cost increases are being passed through. Semtech expects CW-laser transceiver revenue to begin in H1 FY28 and said capacity is limited; management expects 50%+ year-end share for 1.6T FiberEdge, with qualifications finishing early and current capacity potentially insufficient for FY28, especially H2. Revenue and EPS were $341.9M vs. ~$329M expected, $410M vs. ~$360M, and $1.05 vs. $0.73, while unit forecasts have risen from 50M to 80-90M.'),
  ];

  const SRC_FRO_VLCC = [
    src('@marhelmdata', 'X · Aug 26', '2h ago', AV.marhelm,
      '35) War-risk insurance: $250k → up to $10M per Hormuz transit India’s July crude import bill: +41% YoY. 365 tankers changed hands in Jan–Jul 2026 vs 239 in 2025, up ~half YoY.'),
  ];

  const SRC_RVMD_KRAS = [
    src('@biomaven', 'X · Aug 26', '3h ago', AV.biomaven,
      'Note it outperformed adagrasib in a KRAS G12C-amplified model shows preclinical efficacy in switch-II-pocket resistance mutations. So likely will be at least tried in resistance to G12C drugs. In mice models at least it appears to be brain penetrant. Efflux might prove an issue - might need to combine with ABCB1 inhibitor:'),
  ];

  const SRC_NVDA_LOCAL = [
    src('Perplexity', '@perplexity_ai', '3h ago', AV.pplx,
      'With an on-device 27B model, our harness scores 82.6% on real knowledge work, beating open-source harnesses Pi and Hermes. Big thanks to @nvidia for working together with us and supporting this research on DGX Spark as well as enabling an open ecosystem around cost-effective open-weight models, inference frameworks, and hardware with unified memory. https://t.co/FECFESVgYk'),
  ];

  const SRC_EDA_EMULATION = [
    src('sarah guo', '@saranormous', '5h ago', AV.saranormous,
      'people are so excited about alphachip etc. (cool work! ) for ai floorplanning but it’s a relatively small fraction of the full workflow. a lot more to do'),
  ];

  const SRC_MSFT_AGENTS = [
    src('ChatGPT', '@ChatGPTapp', '5h ago', AV.openai,
      'ChatGPT Work can now use its computer and browser to sign in to websites on web and mobile without seeing users’ usernames or passwords. It can handle tasks including booking appointments, managing utilities and insurance, finding doctors or apartments, processing reimbursements and invoices, drafting outreach and replies, filling permit applications, and analyzing ad campaigns.'),
  ];

  const SRC_TSM_PRICING = [
    src('Dwarkesh Podcast', 'Podcast · Aug 25', '7h ago', AV.dwarkesh,
      "OpenAI and Anthropic's compute grew from roughly 2 gigawatts each or less at the start of the year to above 5 gigawatts by year-end, with the two labs estimated to take 40%-50% of incremental compute next year and half by the end of 2027. If current trends continue, they could control most usable flops by late 2028, but reaching 100 gigawatts may require compute prices of $25 million-$50 million per megawatt and roughly $11 trillion in ecosystem CapEx through 2029, including $5 trillion of debt."),
    src('@beth_kindig', 'X · Aug 26', '7h ago', AV.kindig,
      "Samsung's 4nm process SF4 reportedly saw prices for Chinese and US customers rise 10-15% in July, while Taiwanese customers saw price hikes of 5-10%, while 5nm prices rose 10-15%. $TSM $NVDA $AMD"),
  ];

  const SRC_CBRS_ULTRAFAST = [
    src('Tibo', 'X · Aug 26', '7h ago', AV.tibo,
      "Tomorrow's fast will feel like today's ultrafast. As I've mentioned before, we’re pushing to bring this to as many people as possible."),
  ];

  /* Cheaper adequate models, and where the volume goes — 1 */
  const SRC_INFERENCE_VOLUME = [
    src('Olivia Moore', 'X · Aug 26', '4m ago', AV.olivia,
      'Many tasks may have reached diminishing returns on intelligence, that products may stop automatically switching to each new frontier model, and that this creates many opportunities for application builders to reduce COGS.'),
  ];

  /* ── The simulated event and anomaly cards ── */

  /* Semtech's 5.5% session — 4 */
  const SRC_SMTC_MOVE = [
    src('Semtech Corp', 'Q2 FY27 results · press release', '1h ago', AV.smtc,
      'Net sales of $341.9 million and non-GAAP earnings per share of $1.05, both above the high end of guidance.'),
    src('Bloomberg', '@business', '1h ago', AV.bloomberg,
      'Semtech rose the most in four months after raising its 1.6T transceiver unit forecast.'),
    src('Reuters', 'reuters.com', '2h ago', AV.reuters,
      'Analysts framed the raise as a capacity story rather than a pricing one, with qualifications finishing ahead of schedule.'),
    src('SemiAnalysis', 'semianalysis.com', '3h ago', AV.semi,
      'The interesting number is not the beat, it is the unit forecast going from 50M to 80-90M without a matching capacity plan.'),
  ];

  /* Alibaba's open-weight downloads — 7 */
  const SRC_DOWNLOADS = [
    src('Bloomberg', '@business', '2h ago', AV.bloomberg,
      'Alibaba’s open-weight Qwen family passed 3 billion cumulative downloads over the past six months, ahead of Meta’s Llama.'),
    src('Reuters', 'reuters.com', '3h ago', AV.reuters,
      'Chinese open-source releases are being pulled into Western fine-tuning pipelines at a rate that surprised even their authors.'),
    src('Alibaba Group', 'Q1 FY27 earnings call', '1d ago', AV.baba,
      'Model distribution is now a first-order channel for the cloud business, not a marketing line.'),
    src('Hugging Face', 'Trending · August 2026', '6h ago', AV.hf,
      'Four of the ten most-downloaded text models this month are Qwen derivatives.'),
    src('Weights & Moats', '@weightsandmoats', '5h ago', AV.weights,
      'Download counts are a proxy for mindshare, not revenue. Worth keeping the two apart.'),
    src('SemiAnalysis', 'semianalysis.com', '9h ago', AV.semi,
      'Meta has begun benchmarking its next open release against Qwen rather than against its own previous version.'),
    src('r/LocalLLaMA', 'Reddit thread', '11h ago', AV.llama,
      'The fine-tune ecosystem picked a favourite about a week in, and it has not moved since.'),
  ];

  /* AAOI's $600M at-the-market program — 5 */
  const SRC_AAOI = [
    src('Applied Optoelectronics', 'SEC filing · Form 424B5', '3h ago', AV.aaoi,
      'The company may offer and sell shares of common stock having an aggregate offering price of up to $600,000,000.'),
    src('Bloomberg', '@business', '3h ago', AV.bloomberg,
      'Optical names gave back most of the AI-datacenter premium in a single session.'),
    src('CNN Business', '@cnnbusiness', '4h ago', AV.cnn,
      'The second leg down came without a matching move in the optical peer group.'),
    src('Reuters', 'reuters.com', '4h ago', AV.reuters,
      'The program is roughly a fifth of the company’s market value at current prices.'),
    src('Dilution Math', '@dilutionmath', '5h ago', AV.dilute,
      'Roughly 18% dilution at current prices, assuming the full program is used.'),
  ];

  /* Broadcom's fourth custom-accelerator customer — 4 */
  const SRC_XPU = [
    src('Broadcom', 'Q3 FY26 earnings call', '4h ago', AV.avgo,
      'Our AI accelerator backlog now extends four quarters, and it is customer-committed rather than forecast.'),
    src('Reuters', 'reuters.com', '4h ago', AV.reuters,
      'Two people familiar with the schedule said first silicon is targeted for the second half of next year.'),
    src('Microsoft', 'Azure engineering blog', '5h ago', AV.msft,
      'The next generation of the inference fleet is deliberately dual-sourced.'),
    src('AMD', 'Q2 FY26 earnings call', '1d ago', AV.amd,
      'MI-series revenue is now split across more than one hyperscale customer.'),
  ];

  /* Refresh · AAOI's first tranche prices — 2 */
  const SRC_AAOI_PRICING = [
    src('Applied Optoelectronics', 'SEC filing · 424B5 supplement', 'just now', AV.aaoi,
      'The shares offered hereby are being sold at a price representing a discount to the last reported sale price.'),
    src('Dilution Math', '@dilutionmath', '3m ago', AV.dilute,
      'First tranche is being marketed below last night’s close. That is the whole move this morning.'),
  ];

  /* NVIDIA's session with nothing on the tape — 3 */
  const SRC_NVDA_MOVE = [
    src('Flow Desk', '@flowdeskdaily', '2h ago', AV.flowdesk,
      'Closing imbalance to buy, 1.8× the twenty-day median, and not one headline to hang it on.'),
    src('Bloomberg', '@business', '2h ago', AV.bloomberg,
      'NVIDIA finished higher without a company filing or a published revision behind the move.'),
    src('Reuters', 'reuters.com', '3h ago', AV.reuters,
      'Desks described the flow as positioning rather than a response to new information.'),
  ];

  /* TSMC's N2 kit going to the EDA vendors — 6 */
  const SRC_N2_KIT = [
    src('TSMC', 'Technology Symposium · session note', '4h ago', AV.tsm,
      'The N2 design-enablement kit is being made available to certified third-party flows ahead of the reference release.'),
    src('Reuters', 'reuters.com', '4h ago', AV.reuters,
      'The foundry is opening signoff enablement earlier in the node than it did for N3.'),
    src('SemiAnalysis', 'semianalysis.com', '4h ago', AV.semi,
      'Earlier enablement moves the certification work — and the revenue that follows it — a quarter to the left.'),
    src('Cadence', 'Newsroom', '5h ago', AV.cdns,
      'Certification of place-and-route and timing signoff against the kit is under way.'),
    src('Synopsys', 'Newsroom', '5h ago', AV.snps,
      'Extraction and signoff decks are being qualified against the released kit.'),
    src('EDA Bench', '@edabench', '5h ago', AV.edabench,
      'Whoever certifies first gets the tapeouts. That is the entire game at a new node.'),
  ];

  /* Frontline against its own rate — 4 */
  const SRC_FRO_DIVERGE = [
    src('Tanker Tracker', '@tankertracker', '4h ago', AV.tanker,
      'Highest VLCC fixture of the six-week window this morning, and the equity closed red.'),
    src('Reuters', 'reuters.com', '4h ago', AV.reuters,
      'Spot earnings on the benchmark route printed above the recent range.'),
    src('Bloomberg', '@business', '5h ago', AV.bloomberg,
      'Tanker equities lagged the rate move for a second session.'),
    src('Frontline', 'Fleet status · monthly', '5h ago', AV.fro,
      'The fleet remains fully employed on the spot market for the current quarter.'),
  ];

  /* Revolution Medicines putting a date on the readout — 5 */
  const SRC_RVMD_READOUT = [
    src('Revolution Medicines', 'Corporate presentation', '6h ago', AV.rvmd,
      'Enrolment in the Phase 3 arm is complete and the readout is guided to the first half of next year.'),
    src('Reuters', 'reuters.com', '6h ago', AV.reuters,
      'The company named a readout window for the first time since the trial opened.'),
    src('Bloomberg', '@business', '6h ago', AV.bloomberg,
      'The CNS cohort will report on its own timeline rather than with the main arm.'),
    src('CNN Business', '@cnnbusiness', '7h ago', AV.cnn,
      'A dated readout replaces the open-ended guidance the programme has carried for a year.'),
    src('Trial Desk', '@trialdesk', '7h ago', AV.trialdesk,
      'Completed enrolment plus a named half is the pair that usually moves the borrow.'),
  ];

  /* The two EDA names taking the same story differently — 2 */
  const SRC_EDA_SPREAD = [
    src('Flow Desk', '@flowdeskdaily', '6h ago', AV.flowdesk,
      'Same note, both names bid, and the spread between them widened every hour of the session.'),
    src('Bloomberg', '@business', '6h ago', AV.bloomberg,
      'The emulation note lifted both vendors, with the hardware-heavier name taking more of it.'),
  ];

  /* ──────────────────────────────
     The feed

     Seventeen cards at rest and three more behind the pill. Eleven of the
     twenty are the hourly Alpha Radar batches Alva published on the morning of
     26 August 2026, quoted as they ran. The production playbook only produces
     that one type, so the other nine — five unusual-move cards and four
     company events — are written for this prototype, and the list is ordered
     so no more than two cards of a kind ever run together. A feed that is
     eight source cards deep is not a feed, it is a digest: the three types
     have to interleave the way they do in a live list.

     A source card is: the thesis, the passage it stands on, the read, the
     chart. That is the shape of every batch on the production feed, and it
     is the shape here.
     ────────────────────────────── */

  const CARDS = [
    {
      type: 'anomaly',
      tickers: [SMTC],
      age: '1h ago',
      sources: SRC_SMTC_MOVE,
      blocks: [
        { type: 'lead', text: 'SMTC rose 5.5% after raising its 1.6T unit forecast from 50M to 80–90M' },
        {
          type: 'text',
          text: 'The beat itself was ordinary — $341.9M against roughly $329M expected — and the tape ignored it. What it did not ignore was the unit forecast almost doubling while management said current capacity may be insufficient for fiscal 2028. A quantity raise without a capacity raise prices as scarcity, and that is the shape this session had: two legs up, no closing imbalance, nothing given back.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [SMTC],
      age: '2h ago',
      sources: SRC_SMTC_16T,
      blocks: [
        { type: 'title', text: 'Semtech Monetizes Scarce 1.6T Capacity' },
        { type: 'quote', src: SRC_SMTC_16T[0] },
        {
          type: 'text',
          text: "Semtech's booked 1.6T demand, cost pass-through, early qualification and constrained capacity can lift mix, utilization and earnings into fiscal 2028. SMTC is the strongest expression because it owns the cited components and backlog; execution, capacity expansion or competitor share gains are the adverse case.",
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'event',
      tickers: [GOOGL, META, BABA],
      age: '2h ago',
      sources: SRC_DOWNLOADS,
      blocks: [
        {
          type: 'text',
          text: "Alibaba Group Holding's open-weight AI models accumulated more than 3 billion global downloads during the past six months, according to Bloomberg and other reports. The figure surpassed reported downloads for models from Meta Platforms, Alphabet, and domestic peers, making Alibaba's models the world's most downloaded AI models.",
        },
        { type: 'chartRow' },
      ],
    },
    {
      type: 'anomaly',
      tickers: [NVDA],
      age: '2h ago',
      sources: SRC_NVDA_MOVE,
      blocks: [
        { type: 'lead', text: 'NVDA closed 2.2% higher on 1.8× median volume with nothing on the tape' },
        {
          type: 'text',
          text: 'No filing, no guidance, no published revision. The move started twenty minutes after the open and never gave back more than a third of any leg, volume ran at 1.8× the twenty-day median, and the close printed on an imbalance to buy. A session this wide with nothing to point at is usually positioning ahead of something rather than a re-rating of anything.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [FRO],
      age: '2h ago',
      sources: SRC_FRO_VLCC,
      blocks: [
        { type: 'title', text: "VLCC Consolidation Tightens Frontline's Market" },
        { type: 'quote', src: SRC_FRO_VLCC[0] },
        {
          type: 'text',
          text: 'Concentrated VLCC buying can withdraw independently available tonnage just as India-bound freight and Hormuz insurance reprice risk, creating a distinct effective-supply squeeze. FRO is strongest through direct VLCC earnings and asset values; fixed charters, insurance costs, fleet inaccessibility or normalization are the adverse case.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [RVMD],
      age: '3h ago',
      sources: SRC_RVMD_KRAS,
      blocks: [
        { type: 'title', text: 'RVMD Targets Post-Resistance KRAS and CNS Disease' },
        { type: 'quote', src: SRC_RVMD_KRAS[0] },
        {
          type: 'text',
          text: 'Post-resistance activity plus possible brain penetration could give RVMD a differentiated next-line KRAS G12C treatment pool beyond current inhibitors. RVMD is the direct pipeline owner; the adverse case is failed clinical translation, inadequate CNS exposure, efflux requiring combinations, toxicity, or faster competing programs.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'anomaly',
      tickers: [AAOI],
      age: '3h ago',
      sources: SRC_AAOI,
      blocks: [
        { type: 'lead', text: 'AAOI fell again after announcing a $600 million at-the-market equity-sale program' },
        {
          type: 'text',
          text: "A second sharp move today followed an earlier AAOI decline tied to the company's new equity-sale program. Applied Optoelectronics announced an agreement permitting up to $600 million in common-stock sales, raising dilution and share-supply concerns. A weaker U.S. equity market added pressure at the margin.",
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [NVDA],
      age: '3h ago',
      sources: SRC_NVDA_LOCAL,
      blocks: [
        { type: 'title', text: 'Local Agents Create an NVIDIA Appliance Market' },
        { type: 'quote', src: SRC_NVDA_LOCAL[0] },
        {
          type: 'text',
          text: 'Capable 27B local agents can shift part of knowledge-work inference from cloud calls into compact private systems. NVDA is strongest because the demonstrated workload uses DGX Spark and its unified-memory software stack; the adverse case is cloud superiority, cheaper rival appliances, weak adoption, or low incremental margins.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'event',
      tickers: [AVGO, AMD, MSFT],
      age: '4h ago',
      sources: SRC_XPU,
      blocks: [
        {
          type: 'text',
          text: 'Broadcom said on its Q3 call that a fourth custom-accelerator customer has committed to volume, taking the AI backlog out four quarters on customer commitments rather than forecasts. Neither the customer nor the part was named, and the schedule two people described puts first silicon in the second half of next year — which makes this a booking, not a shipment.',
        },
        { type: 'chartRow' },
      ],
    },
    {
      type: 'anomaly',
      tickers: [FRO],
      age: '4h ago',
      sources: SRC_FRO_DIVERGE,
      blocks: [
        { type: 'lead', text: 'FRO fell 1.3% on a day VLCC spot rates set a six-week high' },
        {
          type: 'text',
          text: 'The tape and the rate did opposite things. The benchmark VLCC fixture printed the highest earnings of the six-week window before lunch, and the equity closed 1.3% down within a point of its own six-week high. Nothing was filed and no broker moved. A divergence this clean between a rate and the equity that earns it usually resolves inside a week; the only question is which of the two is wrong.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'event',
      tickers: [TSM, CDNS, SNPS],
      age: '4h ago',
      sources: SRC_N2_KIT,
      blocks: [
        {
          type: 'text',
          text: "Taiwan Semiconductor opened its N2 design-enablement kit to certified third-party flows, according to Reuters and SemiAnalysis, letting Cadence and Synopsys qualify place-and-route, extraction and timing signoff against the node before the foundry's own reference flow ships. Both vendors said certification work is already under way — a quarter earlier in the node than N3 allowed.",
        },
        { type: 'chartRow' },
      ],
    },
    {
      type: 'source',
      tickers: [CDNS, SNPS],
      age: '5h ago',
      sources: SRC_EDA_EMULATION,
      blocks: [
        { type: 'title', text: 'Emulation Becomes Chip Verification Control Plane' },
        { type: 'quote', src: SRC_EDA_EMULATION[0] },
        {
          type: 'text',
          text: 'Hardware emulation is becoming a verification control plane as chip and software complexity make late bugs and respins costlier. CDNS and SNPS are the strongest joint expression through Palladium and ZeBu plus attached licenses and support; cloud simulation, delayed purchases, or share shifts are the adverse case.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [MSFT],
      age: '5h ago',
      sources: SRC_MSFT_AGENTS,
      blocks: [
        { type: 'title', text: 'Authenticated Agents Open a Workflow Control Plane' },
        { type: 'quote', src: SRC_MSFT_AGENTS[0] },
        {
          type: 'text',
          text: 'Secure authenticated agents can move AI from answers into delegated enterprise workflows such as reimbursements, invoices, permits, recruiting, and vendor actions. MSFT is the strongest available expression through productivity, identity, and cloud distribution; the adverse case is OpenAI or rivals owning the workflow economics without Microsoft integration.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'anomaly',
      tickers: [SNPS],
      age: '6h ago',
      sources: SRC_EDA_SPREAD,
      blocks: [
        { type: 'lead', text: 'SNPS rose 3.6% while CDNS took 5.1% out of the same note' },
        {
          type: 'text',
          text: 'Both names traded one story and the gap between them widened every hour. Synopsys closed 3.6% up on 1.4× median volume, Cadence 5.1% up on 1.2×. The spread is the market putting the emulation share where the hardware is rather than where the licence base is — which is a view, and one worth checking against the next two quarters of hardware revenue.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'event',
      tickers: [RVMD],
      age: '6h ago',
      sources: SRC_RVMD_READOUT,
      blocks: [
        {
          type: 'text',
          text: 'Revolution Medicines put a date on the Phase 3 arm of its KRAS G12C programme, naming the first half of next year and confirming enrolment is complete, according to a corporate presentation and Reuters. The CNS cohort will report on its own timeline rather than alongside the main arm.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [TSM],
      age: '7h ago',
      sources: SRC_TSM_PRICING,
      blocks: [
        { type: 'title', text: 'TSMC Captures Frontier Compute Pricing' },
        { type: 'quote', src: SRC_TSM_PRICING[0] },
        { type: 'quote', src: SRC_TSM_PRICING[1] },
        {
          type: 'text',
          text: 'TSMC can monetize a demand-to-contract-pricing loop: frontier labs with strong inference economics may keep bidding for scarce compute, with reported 5-15% advanced-node price increases showing scarcity reaching contracts. TSM is best positioned through qualified leading-edge capacity; key risks are non-transferable Samsung constraints, alternative foundries, customer-owned chips, and geopolitical disruption.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [CBRS],
      age: '7h ago',
      sources: SRC_CBRS_ULTRAFAST,
      blocks: [
        { type: 'title', text: 'Cerebras Converts Ultrafast Demand Into Capacity' },
        { type: 'quote', src: SRC_CBRS_ULTRAFAST[0] },
        {
          type: 'text',
          text: "Cerebras's unique hardware is explicitly tied to strong OpenAI demand for ultrafast inference, creating a potential specialized-capacity expansion and utilization loop. CBRS is the direct hardware collaborator; OpenAI could internalize silicon, diversify suppliers, or retain economics, and production scale remains unquantified.",
        },
        { type: 'chart' },
      ],
    },
  ];

  /* What the pill brings in: the 10:58 batch, which is exactly how the
     production playbook behaves — new batches at the top, full history
     below. Two cards, one and two sources, because that is what new means. */
  const NEW_CARDS = [
    {
      type: 'source',
      tickers: [TSM],
      age: 'just now',
      sources: SRC_TSM_CUSTOM,
      blocks: [
        { type: 'title', text: 'TSMC Captures The Custom-Chip Bottleneck' },
        { type: 'quote', src: SRC_TSM_CUSTOM[0] },
        { type: 'quote', src: SRC_TSM_CUSTOM[1] },
        {
          type: 'text',
          text: "AI-assisted chip design can broaden the custom-silicon project funnel while frontier labs' profitable inference supports aggressive compute bids. TSM is the strongest expression because scarce leading-edge manufacturing captures utilization and pricing; the adverse case is alternative foundries, customer-owned chips, non-transferable demand, or weaker AI economics.",
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [GOOGL],
      age: '2m ago',
      sources: SRC_GOOGL_GEMINI,
      blocks: [
        { type: 'title', text: 'Gemini Verticalizes Regulated Workflows' },
        { type: 'quote', src: SRC_GOOGL_GEMINI[0] },
        {
          type: 'text',
          text: 'Vertical legal and financial-services modules can turn Gemini from a general assistant into repeatable regulated workflows, improving paid-seat conversion and cloud consumption. GOOGL owns the model, product and distribution; Microsoft competition, services intensity or weak adoption could absorb the benefit.',
        },
        { type: 'chart' },
      ],
    },
    {
      type: 'source',
      tickers: [NBIS, PLTR],
      age: '4m ago',
      sources: SRC_INFERENCE_VOLUME,
      blocks: [
        { type: 'title', text: 'Cheaper Models Expand Inference Volume' },
        { type: 'quote', src: SRC_INFERENCE_VOLUME[0] },
        {
          type: 'text',
          text: 'Cheaper adequate models can convert lower application COGS into more production inference rather than merely lower customer bills. NBIS is the strongest infrastructure expression because it directly captures the resulting model-serving utilization, while PLTR offers a distinct application-margin route but weaker direct exposure.',
        },
        { type: 'chartRow' },
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

  /* Ticker / Stance (1664:17174). Alva's call on the name, not the tape's
     direction — which is why the same card can carry a bullish name and a
     bearish one, and why the arrow's bearing is the whole message: the dial
     is one glyph rotated, not four icons. `none` is the state that earns its
     keep: a dashed ring and no arrow says Alva has not formed a view, which
     is a different claim from having looked and found it flat. */
  const STANCE = {
    bull: 'Bullish',
    bear: 'Bearish',
    flat: 'Flat',
    none: 'No call',
  };

  function stanceNode(key) {
    const k = STANCE[key] ? key : 'bull';
    const wrap = el('span', 'stance ' + k);
    const dial = el('span', 'stance-dial');
    /* No arrow on `none`: there is no direction to point. */
    /* Its own arrow, not the 20px library glyph scaled to 8: at that scale the
       library outline's 1-unit line lands at 0.4px and its fill sits at 90%
       alpha, which is why the dial read thin against the frame. This one is
       authored for the size it is drawn at — a 12 viewBox at 8px, so a stroke
       of 1 renders 0.67, and the arrow spans 7 of 12 rather than 15 of 20. */
    if (k !== 'none') dial.appendChild(icon('ui-arrow-stance.svg'));
    wrap.appendChild(dial);
    wrap.appendChild(el('span', 'stance-txt', STANCE[k]));
    return wrap;
  }

  function tickerChip(t) {
    const wrap = btn('ticker', t.sym + ' · ' + STANCE[t.stance || 'bull']);
    wrap.appendChild(img(t.logo, 'ticker-logo'));
    const text = el('div', 'ticker-text');
    text.appendChild(el('span', 'ticker-name', t.sym));
    text.appendChild(stanceNode(t.stance));
    wrap.appendChild(text);
    wrap.addEventListener('click', e => { e.stopPropagation(); openTicker(t); });
    return wrap;
  }

  /* The tile is one of the design's own two chart pictures, alternating down
     the feed — the line chart, then the candles, then the line chart again.
     Alva cannot render a compliant chart image inside a prototype, so these
     are indicative art rather than this ticker's tape, and pretending
     otherwise is what the generated sparkline they replace was doing: it drew
     a curve precise enough to be read as data it did not have.

     The turn is a counter the feed resets on every render, so the same list
     always alternates the same way. Both pictures are light-ground, which is
     why they keep `--media-filter` — in dark mode the raster inverts. */
  const MEDIA = [A + 'feed-media-line.webp', A + 'feed-media-candles.webp'];
  let mediaTurn = 0;

  function chartTile(t, cls) {
    const tile = btn(cls, t.sym + ' chart');
    tile.appendChild(img(MEDIA[mediaTurn++ % MEDIA.length]));
    tile.addEventListener('click', e => { e.stopPropagation(); openFullChart(t); });
    return tile;
  }

  function block(b, card) {
    if (b.type === 'text') return el('p', 'blk-text', b.text);
    if (b.type === 'lead') return el('p', 'blk-text blk-lead', b.text);
    if (b.type === 'title') return el('p', 'blk-text blk-title', b.text);

    /* The quote is not decoration, it is the card's first source shown in
       place — so it opens the same sheet the footer opens. That is how the
       production feed behaves, and it is the only reading that makes the
       block mean anything: you are looking at a source, tapping it should
       show you the source. */
    if (b.type === 'quote') {
      const src = b.src;
      /* Markdown - Quote has two variants and the card decides which:
         a card that already carries a title of its own gets the tile with the
         passage at Regular/12, and a card that does not gets the passage *as*
         the title — Medium/16, no tile, speaker underneath. Reading it off the
         card's own blocks rather than off a flag means the two can never
         disagree about whether the card has a title. */
      const h2 = !card.blocks.some(o => o.type === 'title' || o.type === 'lead');
      const q = btn('quote' + (h2 ? ' quote-h2' : ''), 'Sources');
      const head = el('div', 'quote-head');
      head.appendChild(img(src.img, 'quote-avatar'));
      head.appendChild(el('span', 'quote-name', src.name));
      q.appendChild(head);
      /* The typographic pair belongs to the H2 variant only: in the tile the
         mark in the corner is already doing that job. */
      q.appendChild(el('p', 'quote-body', h2 ? '\u201c' + src.quote + '\u201d' : src.quote));
      q.appendChild(el('span', 'quote-mark', '\u201d'));
      q.addEventListener('click', e => { e.stopPropagation(); openSources(card); });
      return q;
    }

    /* One chart per ticker, always: a card about two names draws two, and
       nobody has to wonder which tape a tile belongs to. */
    if (b.type === 'chart') {
      const stack = el('div', 'chart-stack');
      card.tickers.forEach(t => stack.appendChild(chartTile(t, 'media')));
      return stack;
    }

    if (b.type === 'chartRow') {
      const row = el('div', 'media-row');
      card.tickers.forEach(t => row.appendChild(chartTile(t, 'media-tile')));
      return row;
    }

    return el('div');
  }

  function cardNode(card) {
    const node = el('article', 'card');

    /* Feed Card - Meta (1629:17047): who made this and how old it is. */
    const meta = el('div', 'card-meta');
    const auto = el('div', 'card-auto');
    auto.appendChild(img(A + 'feed-dot-green.svg'));
    auto.appendChild(el('span', null, card.automation || AUTOMATION[card.type] || AUTOMATION.event));
    meta.appendChild(auto);
    meta.appendChild(el('span', 'card-age', card.age));
    node.appendChild(meta);

    const head = el('div', 'card-head');
    card.tickers.forEach((t, i) => {
      if (i) head.appendChild(el('span', 'head-rule'));
      head.appendChild(tickerChip(t));
    });
    node.appendChild(head);

    const body = el('div', 'card-body');
    card.blocks.forEach(b => body.appendChild(block(b, card)));
    node.appendChild(body);

    const footEl = el('div', 'card-foot');

    /* Every part of the left half comes off card.sources, so the faces, the
       name and the count can never drift from the sheet the row opens. Three
       faces is what the frame shows; the rest are behind the number, and the
       name is the first source's — the one you would give if asked where the
       card came from. */
    const lead = btn('foot-lead', 'Sources');
    const stack = el('div', 'sources');
    card.sources.slice(0, 3).forEach(src => stack.appendChild(img(src.img)));
    lead.appendChild(stack);
    lead.appendChild(el('span', 'foot-src', card.sources[0].name));
    const rest = card.sources.length - 1;
    if (rest > 0) lead.appendChild(el('span', 'foot-more', '+' + rest));
    lead.addEventListener('click', e => { e.stopPropagation(); openSources(card); });
    footEl.appendChild(lead);

    const label = ASK[card.type] || ASK.event;
    const ask = btn('ask', label);
    ask.appendChild(icon('ui-chat-ai-l.svg'));
    ask.appendChild(el('span', null, label));
    ask.addEventListener('click', e => {
      e.stopPropagation();
      showTab('chat');
      toast('Alva picks the thread up in Chat');
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
  const refreshNote = document.getElementById('refreshNote');
  const refreshNoteText = document.getElementById('refreshNoteText');
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
    /* Reset the media turn with the list, so the alternation is a property of
       the feed's order rather than of how many times it has been rebuilt. */
    mediaTurn = 0;
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
    const line = el('div', 'seen-line');
    line.appendChild(el('i'));
    line.appendChild(el('span', null, 'You were here'));
    line.appendChild(el('i'));
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
      refreshNoteText.textContent = 'You’re all caught up';
      refreshNote.classList.add('show');
      await wait(1000);
      await springTo(0);
      refreshNote.classList.remove('show');
      refreshNoteText.textContent = '';
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

    /* Avatar and byline are one group 8 apart; that group, the time and the
       button are the row's three columns, 12 apart (I1180:20235;1178:20237). */
    const who = el('span', 'src-who');
    const av = el('span', 'src-av');
    av.appendChild(img(s.img));
    if (s.badge && BADGE[s.badge]) {
      const badge = el('span', 'src-badge');
      badge.appendChild(icon(BADGE[s.badge]));
      av.appendChild(badge);
    }
    who.appendChild(av);

    const id = el('span', 'src-id');
    id.appendChild(el('span', 'src-name', s.name));
    id.appendChild(el('span', 'src-handle', s.handle));
    who.appendChild(id);
    head.appendChild(who);

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
  const followed = new Set(['GOOGL', 'NVDA']);   /* the two the Me screen counts */

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
          if (label === 'Fullscreen') openFullChart(t);
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

  function openFullChart(t) {
    if (fsChart) fsChart.dispose();
    fs.classList.add('show');
    fs.setAttribute('aria-hidden', 'false');
    /* The session belongs to the name that opened it. A fixed crash shape
       scaled to every ticker put the previous close outside its own range on
       any name that rose, so the series is generated from the ticker's own
       day instead: its close, its net change, its seed. */
    const data = t ? sessionSeries(t.seed, t.price, 112, 0.0042, t.pct) : eventSeries(51217);
    let prev = 124.87, event = 112.69;
    if (t) {
      prev = t.price - t.chg;
      /* Where the move came from: the low of an up day, the high of a down
         one — the point the three labelled prices are measured against. */
      let ext = data[0].close;
      data.forEach(d => {
        if (t.pct >= 0 ? d.low < ext : d.high > ext) ext = t.pct >= 0 ? d.low : d.high;
      });
      event = ext;
    }
    /* The three numbers the design labels, in the order they matter:
       where the day started from, what the event printed at, where it is. */
    fsChart = mountChart(fsPlot, data, {
      lines: [
        { price: prev, tone: 'amber', title: 'Previous close' },
        { price: event, tone: 'm2', title: 'Event price' },
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
    pillText.textContent = NEW_CARDS.length + ' new feeds';
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
