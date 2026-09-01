# Alva · Design Prototypes

A single-page gallery of interactive design prototypes for Alva. One page, two layouts:

- **Desktop** — the list of prototypes on the left, the selected prototype running on the right, inside an iPhone mockup that scales to fit the window.
- **Phone** — two views. The list, then the prototype full-screen with no mockup and no added chrome, because it is already running on a phone. The system back gesture returns to the list.

### ▶︎ [Open the live prototypes](https://robertlee8888.github.io/m.baby/)

## Contents

| | | Source |
| --- | --- | --- |
| `index.html` · `shell.css` · `shell.js` | **The shell** — the list, the stage, the phone mockup, and hash routing | — |
| `mvp.html` · `mvp.css` · `mvp.js` | **MVP** — the whole loop: the For You feed (three card types, eight items, a topbar that collapses on scroll), Market, Alva, Me, and the three surfaces a card opens (its sources, a ticker, the chart fullscreen). Appearance defaults to System, with durable Light and Dark overrides | [For You](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=1496-32177) · [Sources](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=545-62549) · [Ticker](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=957-18126) · [Chat / Alva](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=545-62465) · [Me](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=360-37134) · [Appearance](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=2932-26436) · [Fullscreen chart](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=2244-19642) |
| `mvp-onboarding.html` · `mvp-onboarding.css` · `mvp-onboarding.js` | **MVP onboarding** — welcome, choose what to follow with search/filter, turn on notifications, log in, then hand off to the MVP For You feed | [Welcome](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=545-63760) · [Choose what to follow](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=545-63777) · [Notifications](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=1769-18035) · [Login](https://www.figma.com/design/A4jIwN4EMWr0fJVVGmCIsr/Mobile?node-id=2585-90370) |
| `alpha-radar.html` · `alpha-radar.css` · `alpha-radar.js` | **Alpha Radar mobile onboarding** — source selection, radar setup, login, and building states across 8 screens. On the three source-selection screens a collection card opens a member bottom sheet | [Alpha Radar onboarding](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=13241-205457) · [Collection member sheet](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14144-48781) |
| `onboarding.html` · `styles.css` · `app.js` | **Immersive onboarding** — FinTwit Digest path, 6 screens | [Onboarding · Production v4 · FinTwit path](https://www.figma.com/design/A4jIwN4EMWr0fJVVGmCIsr/Mobile?node-id=1355-5243) |

Zero dependencies — plain HTML / CSS / JS, no build step. Alva design tokens (`main/m1 #49a3a6`, `text/n9…n3`, `line/l05…l3`), the Delight typeface, and assets exported from Figma.

## MVP — the whole loop

`#/mvp`. Four screens in the tab bar (For You, Market, Alva, Me) and three overlays
that open out of a feed card (its sources, a ticker, the chart fullscreen).
Everything below is measured off the Figma frames listed in Contents, not
eyeballed from a screenshot.

Re-selecting the active For You or Market tab returns its list to the top in
240ms without discarding the current content. Once For You is already at the
top, another tap runs the same refresh sequence as pull-to-refresh; Market has
no refresh action on a second tap.

Three things in a card are doors, and each one opens the surface it points at
rather than a toast:

| Tap | Opens | Figma |
| --- | --- | --- |
| a ticker chip | the ticker sheet, with its own follow star | 957:18126 |
| a quote block | the sources sheet — the quote *is* one of the sources | 1642:17075 |
| the sources row in the footer | the sources sheet for *that* card | 545:62549 |
| any chart, wide or a tile in a row | the chart, fullscreen | 2244:19642 |
| the footer's button — Track This / What's my impact / Dig Deeper | the Chat screen | 906:86629 |

### The card is one object

8 of padding top and bottom, a 0.5px `line/l12` hairline along the **top**
edge, no card radius, no shadow — and **no gap between its four parts**. Every
seam inside the card is 12, and each part owns its own half of that 12:

| | Padding | Height | Contents |
| --- | --- | --- | --- |
| Meta | `4 16 0` | 24 | 6px status dot + the automation in `text/n5`, the age right-aligned in `text/n5` |
| Header | `12 16` | 62 | one to three tickers, 16 apart, divided by a 24-tall hairline; symbol over stance, the two lines overlapping by 4 |
| Content | `0 16` | hugs | markdown blocks, 12 apart; the read and its Show more row are one block inside that 12, stacked at 0 |
| Footer | `12 16 4` | 48 | source stack + name + `+N`, and one 32-tall labelled button |

8 of card + 4 of meta = 12 above the automation line; 0 + 12 = 12 to the ticker
row; 12 + 0 = 12 to the first block; 0 + 12 = 12 to the footer; 4 + 8 = 12
below it. A uniform 12 the whole way down, and because the spacing is padding
rather than a flex `gap`, a part that grows or is switched off takes its own
spacing with it instead of leaving a hole behind. The three cards the frame
draws measure 451 / 553.06 / 609 here, against its 451 / 553.06 / 609.

### Three cards, three data types

The three cards in the Figma frame are not three layouts. They are three
kinds of thing Alva found, and each one has its own grammar of blocks — which
is what makes them tell apart at a glance in a list you are thumbing through:

| Type | What it is | Blocks | Tickers | Playbook | Action |
| --- | --- | --- | --- | --- | --- |
| `event` | a company event, read and analysed | `text` → `media` | one or several | `company-events` | Track This |
| `anomaly` | one name moving in a way that needs explaining | `lead` → `text` → `media` | **exactly one** | `unusual-moves` | What's my impact |
| `source` | something a source published, tracked and analysed | `title` → `quote` → `text` → `media` | one or several | `investor-roundtable` | Dig Deeper |

An anomaly gets exactly one ticker because an anomaly belongs to a single
tape: two names cannot share one unusual move. The other two can carry a
whole basket, and do — the download story runs across GOOG, META and BABA
because that is who it is about.

The `lead` exists only on anomalies, and the `quote` only on source cards.
That is not decoration: an anomaly has to say *what happened* before it says
why, and a source card has to show the passage before it shows the read. The
footer's playbook name follows from the type rather than being typed in, so a
card cannot claim to have come from an automation that would not have found
it.

### The blocks themselves

| Block | Figma | Type |
| --- | --- | --- |
| `text` | Markdown/M | Regular 14/22 |
| `lead` | Markdown/M | Medium 14/22 — the one-line "what happened" |
| `title` | Markdown/M | Medium 16/26 — a named thesis |
| `quote` | Markdown - Quote `Type=正文` | `content/br03` tile, radius 8, passage at Regular 14/22, speaker at 24px, the mark hanging 5 above the top-right corner |
| `quote` | Markdown - Quote `Type=标题` | no tile, passage at Medium 14/22, speaker underneath at 24px in `text/n5` |
| `media` (one ticker) | Media = 1 | gutter to gutter, 240 × 135, one of the design's two pictures |
| `media` (two or three) | Media > 1 | 240 × 135 tiles, 8 apart, the two pictures alternating |

### Eleven of the twenty cards are real

The source-type cards are not written for this prototype. They are the hourly
Alpha Radar batches Alva's own production playbook published on the morning of
26 August 2026 — headline, quoted passage, read, and the ticker's last price,
day change and six-week range, taken as they ran:

| # | ticker | batch |
| --- | --- | --- |
| 1 | TSM | TSMC Captures The Custom-Chip Bottleneck |
| 2 | GOOGL | Gemini Verticalizes Regulated Workflows |
| 3 | SMTC | Semtech Monetizes Scarce 1.6T Capacity |
| 4 | FRO | VLCC Consolidation Tightens Frontline's Market |
| 5 | RVMD | RVMD Targets Post-Resistance KRAS and CNS Disease |
| 6 | NVDA | Local Agents Create an NVIDIA Appliance Market |
| 7 | CDNS · SNPS | Emulation Becomes Chip Verification Control Plane |
| 8 | MSFT | Authenticated Agents Open a Workflow Control Plane |
| 9 | TSM | TSMC Captures Frontier Compute Pricing |
| 10 | CBRS | Cerebras Converts Ultrafast Demand Into Capacity |
| 11 | NBIS · PLTR | Cheaper Models Expand Inference Volume |

The three newest batches are held back behind the pill, because that is what
the production playbook does — new batches at the top, full history below — so
the refresh brings in the hour that has actually just landed rather than cards
invented to have something to arrive. The pill counts them rather than naming
a number: `NEW_CARDS.length + ' new feeds'`, so the label cannot outlive the
batch it describes.

What is *not* real: the nine event and anomaly cards interleaved between them.
The production playbook only produces the source type — which is why an early
draft of this feed was eight source cards deep and read like a digest rather
than a list — so five unusual-move cards and four company events are written
here, and the order is set so **no more than two cards of a kind ever run
together**. They are written on the same names and the same numbers wherever
they can be — the SMTC anomaly is that ticker's real +5.47% session and the
real revenue and unit figures behind it. The names the page did not
price for me (META, BABA, AAOI, AVGO, AMD, and now NBIS and PLTR) carry
plausible prices rather than quoted ones.

And a rule that follows from this: **no invented words in a real person's
mouth.** Every quote attributed to a named account is the passage the batch
quoted. The simulated cards cite outlets, filings and two clearly fictional
handles, and never a real person.

### The card is a byline, a header, a body and one action

The 2026-08-26 frame (`1496:32177`) rebuilds the card around four rows, and
each of the four moved for a reason:

**Feed Card - Meta** (`1629:17047`) is new, and it takes two things that used
to live in the footer: the automation that produced the card, and how old the
card is. That is the right place for both. The automation is a byline — it says
which playbook was watching when this happened — and a byline belongs above
the thing it signs, not down among the actions. The name is `text/n5` beside a
6px status dot in `main/m1`; the label stays `text/n5`, so state is visible
without making the automation name look tappable. The age is right-aligned in
`text/n5`, matching the automation label, because position already makes it
secondary.

**Ticker / Stance** (`1664:17174`) replaces the price and change that used to
sit under the symbol. This is the biggest change in the round and the most
opinionated: the header no longer reports the tape, it reports *Alva's call*.
A filled dial and a white arrow whose bearing is the conclusion — up-right
bullish (`main/m3`), down-right bearish (`main/m4`), horizontal flat
(`grey/g3`) — so one glyph rotated three ways carries what three colours of
number used to. The fourth state earns its place by being a different kind of
claim: a dashed empty ring and "Anomaly" says the evidence does not resolve to
a directional call,
which is not the same statement as having looked and found it flat.

Two things about building it. The rotations in the frame are **−45 / −135 /
−90** and in CSS they are **+45 / +135 / +90**: Figma measures rotation
counter-clockwise-positive, the web measures it clockwise, and copying the
sign across pointed every call at the wrong quadrant — a bullish arrow aiming
up and to the *left*. It renders; it is just wrong, which is the worst kind of
wrong. And the dashed ring is the one stroke in this build that is a real 1px
rather than a hairline, because the frame draws 1 dashed 2/2 and a 0.5 dash at
12px across renders as grey fuzz instead of four dashes.

Because a stance is a view on a name rather than on a session, it lives on the
ticker and not on the card — one call per symbol, the same wherever the symbol
appears. Which also meant it could no longer be Tailwind fifteen times: MSFT
and AMD and PLTR are Context, CBRS is Anomaly, META and AAOI are Headwind. A
header that is unanimously bullish is not a header, it is a decoration.

**Feed Card - Footer** loses the automation and gains a label. The left half is
now the faces, the name of the source that carries the card, and `+N` for the
rest — the name capped at the frame's own 145px so it truncates rather than
pushing the count off the row, because the count is the part that says there
is more. The right half is the Library's `Button · Secondary · S 32`
(`906:86629`) with a label instead of a bare icon, and the label follows the
card's type: an event is a name to start watching (**Track This**), an anomaly
is a move you want measured against what you hold (**What's my impact**), and
a source is a thesis you want taken further (**Dig Deeper**). The card already
knows which question is worth asking; saying so out loud is most of the value.

### The mark hangs outside the tile

The `”` is 64px Delight Bold in `main/m3` at 60%, and its box sits at y −5 in
the frame — it hangs above the tile's top edge on purpose. Figma renders the
component 193 tall against its own 188 height, which is the proof. The tile
carried `overflow: hidden` and sheared the top off both bars; nothing else
inside the tile overflows, so the fix is simply not to clip it. It now hangs 5
into the 12 of gap above, which is what the frame does.

### The stance arrow is drawn for the size it is drawn at

The dial's arrow was the 20px library `arrow-up-l1` scaled into an 8px box, and
at 0.4 scale its 1-unit outline lands at 0.4px with the fill sitting at 90%
alpha — a hairline, and visibly thinner than the frame's. The frame's arrow is
the same glyph but redrawn small inside the instance *and* given a 0.45 stroke
on top, which is a combination a mask cannot reproduce by scaling.

So the arrow is authored for the size it renders at: a 12-unit viewBox drawn at
8px, stroke 1.17 units, shaft 9.09 units. `absoluteRenderBounds` on the frame's
own vector says its ink is a 5.132px square with a 0.61px line, and this one
measures 5.00px and 0.62px — arrived at by rendering at DPR 16, masking to the
dial's disc and measuring the ink, because the arithmetic from the exported
path and the arithmetic from the component tree disagreed with each other and
with what the browser drew.

### Markdown - Quote has two jobs

`1642:17075` ships two variants and the component's own description says when
each applies: `Type=正文` when the card already carries a title, and
`Type=标题` when it does not — there, the quote *is* the title, so it drops the
tile, takes `Medium/14`, and moves the speaker underneath as a
byline in `text/n5`.

The renderer reads which one to use off the card's own blocks
(`!card.blocks.some(b => b.type === 'title' || b.type === 'lead')`) rather
than off a flag, so a card and its quote can never disagree about whether the
card has a headline. **No card in this build triggers the H2 variant** — all
eleven real batches came with a headline of their own — so it is capability
rather than something you can see by scrolling; the verification pass builds
one by hand to prove the branch and its CSS, instead of assuming an unrendered
path works.

### The quote is a way in

Tapping a quote opens the same sources sheet the footer opens, because the
quote *is* one of the card's sources rendered in place. That is how the
production feed behaves, and it is the only reading that makes the block mean
anything: you are looking at a source, so tapping it should show you the
source. The block takes its avatar, its name and its text off the source
object rather than carrying its own copy, which is why the two can never say
different things.

### The source list is the only source of truth

A card carries its own `sources` array, and everything about sources is read
off it. The name in the footer is `sources[0].name`, the count beside it is
`sources.length - 1` written as `+N`, the faces are the first three, and the
sheet is the whole list. There is no second place to
edit, so the footer cannot disagree with what opens when you tap it — which
it did, before this: every card said "5 sources" and showed the same three
faces while the sheet held seven rows.

The counts run the whole way from 11 down to 1, because a feed where every
story has the same number of sources is a feed nobody counted. The real
batches cluster at the bottom of that range — a production batch usually
stands on one quoted passage — and the written event and anomaly cards, which
are reporting rather than quoting, carry the longer lists. The ones the pill brings in carry the *fewest*, often just one: a
story that broke four minutes ago has not been picked up yet, and that
asymmetry is most of
what makes "just now" believable.

### Every source has a face

The Feed and Sources surfaces use exactly two source-avatar sizes: **24px** in
quote bylines and footer stacks, and **32px** in source-list identity rows.
The 16px corner mark is a platform badge, not a third avatar size.

No monograms. A letter in a circle is what you put there when you have not
decided who the source is, and at 24px in an overlapping stack it reads as
placeholder art. Every row carries a real image instead, from one of three
places:

- **The outlet's own mark** — Bloomberg's B, the Reuters dots, CNN,
  SemiAnalysis, and Hugging Face fetched into `assets/src-*.svg`. Square glyph
  marks only: a wordmark squeezed into a 32px circle is unreadable, which is
  why the wide ones were thrown away again after being downloaded.
- **The company's own logo, when the company is the one talking.** A
  Form 8-K row shows the company that filed it, an earnings-call row shows
  the company whose call it was — and those are the same seven files the
  ticker chips use, so there is nothing extra to keep in sync. This is also
  why "SEC EDGAR · AAOI · Form 424B5" became "Applied Optoelectronics ·
  SEC filing · Form 424B5": the filer is the source, and the filer has a
  logo.
- **The channel's own avatar**, for every account. A handle keeps its face
  wherever it turns up — the same account on two stories is the same person,
  or the same show.

The press cast is small on purpose: it is the outlets whose marks read at
32px. Rows that used to be attributed to an outlet with no usable mark were
re-attributed rather than given a letter tile.

### The way out of a source row follows the excerpt

The timestamp owns the top-right corner by itself. The way out sits 4px below
the excerpt, so it reads like the feed body's `Show more` rather than a second
metadata value. Its label is the destination's first-level domain (`x.com`,
`reuters.com`) in `text/n7` Regular at 14/22, followed by the 14px `popout-l`
icon. Every destination uses the same dotted underline; there is no platform-
specific link treatment. The timestamp uses `text/n5`.

It used to be a 28-tall outlined button, and at the end of a row whose left
side is a name and a handle that control was the loudest thing in the sheet
while being the least interesting: the excerpt underneath is what you came for.
A link reads as a way out without asking to be the point.

### The avatar is the channel, the badge is the platform

A source is either a voice on somebody else's platform or a publisher on its
own channel, and that is the whole rule. An account on X, a show on a podcast
feed, a channel on YouTube, a subreddit: the row shows **the channel's own
avatar** with the platform's mark on the corner. An outlet publishing on its
own site, a company filing, an earnings call: **no badge**, because there is no
third party to name. CNN's X account wears the X mark; cnn.com does not.

Two rows were breaking that rule by showing the *platform* where the channel
belonged. Dwarkesh Podcast carried the Apple Podcasts app icon as its avatar
and no badge; r/LocalLLaMA carried Reddit's logo the same way. Both now show a
channel avatar with a podcast or Reddit badge, exactly as the X rows always
did — which is what the platform logo was standing in for, badly, all along.

The platform is derived from the handle rather than typed in beside it:

```js
const PLATFORM = [
  [/podcast/i,                 'podcast'],
  [/youtube/i,                 'youtube'],
  [/reddit|^r\//i,             'reddit'],
  [/(^|[\s·])X([\s·]|$)|^@/,   'x'],
];
```

So a row cannot say "Podcast · Aug 25" and wear the wrong mark, and there is
one `src()` helper instead of the old `x()` / `pic()` pair that made the badge
a choice at the call site. Of the four marks, three are in use — 14 X rows, one
podcast, one subreddit, 13 own-channel rows with no badge. Nothing in this
build is a YouTube source; the rule covers it when one arrives.

The badges are monochrome masks over `currentColor` on a white disc, like the X
badge the design draws (`Avatar / X source`), not brand-coloured logos: at 16px
on the corner of a 32px avatar, four brand colours fight the avatar underneath
and each other.

### Where the marks come from

Ticker logos are the real ones, fetched as PNGs and set on the `#F0F3FA` plate
the design's own Figma exports use, so a 36px circle reads the same whichever
mode it is in. One name has no mark anywhere reachable: Cerebras. It gets the
dark disc with the symbol on it that Alva's own feed shows for CBRS — the
product's real fallback, not a letter tile invented here.

Brand accounts get their own marks (Perplexity, OpenAI). The nine people the
batches quote get the nine portrait avatars, bound one-to-one, and the two
simulated handles that survive on the event and anomaly cards take the two
that are left, so nobody wears somebody else's face. Those portraits are the
Alva design assets rather than the accounts' own photographs, which is the one
place the sheet is dressed rather than quoted — X's image host is not
reachable from here.

### The topbar's line belongs to the scroll, not to the bar

The frame switches the bar's bottom stroke off (1496:32179), and **at rest that
is right**: the line under the bar is the first card's own top rule, sitting at
the bar's bottom edge by construction. One line, owned by the thing that
scrolls.

The moment the list moves it stops being right. The card's rule travels up
under the bar, and from then until the bar has fully closed there is nothing
between the chrome and the text — a paragraph running straight into the status
bar. Removing the rule outright, which this build did for two rounds, traded a
double line at rest for no line at all in the state that needs one most.

So the rule exists and is tied to the scroll: pinned to `status + bar-h` — the
bottom of whatever is left of the bar, and once the bar has closed, the bottom
of the status bar itself — and faded in over the first three pixels of travel,
so it has taken over by the time the card's rule has left. The two are never
both visible. It is a standalone element rather than an inset shadow on the bar
because an inset shadow has nothing to paint on at height 0, which is exactly
the state that needs it.

### The topbar leaves with the list

Twitter's home header does not shrink, it goes. A large title is not chrome,
it is the first thing in the list, so scrolling it away is scrolling away a
list item: the title fades and lifts, the bar closes to **nothing**, and the
feed runs right up under the status bar. Scroll back up and it comes back.

The travel is the bar's own 58px, so it has finished closing at the moment it
would have scrolled out of view anyway. The title fades at 2.2× that rate,
because a title at 20% opacity under a half-closed bar reads as a rendering
bug rather than a transition.

One thing worth knowing if you touch this: the 16 above the title and the 8
below it are the *title's margins*, not the bar's padding. With `border-box`
a padded box cannot be shorter than its own padding, so as padding they
bottomed the bar out at 24 and it never closed.

Two implementation notes, both of which are the reason it does not judder:

- **One number.** The scroll handler writes `--bar-p` (0 → 1) and nothing
  else. The bar's height and the new-cards pill's position are both `calc()`
  off it, so they cannot fall out of step.
- **The scroll container never resizes.** The feed starts under the *status
  bar*, and a spacer the exact height of the expanded topbar stands where the
  topbar is. Collapsing the bar therefore changes no layout inside the
  scroller: `scrollTop` means the same thing before and after, and the first
  card's top edge tracks the bar's bottom edge by arithmetic — 58 of spacer
  minus *n* of scroll is the 58 − *n* the bar has left. Animating the
  scroller's own `top` inset instead would double-count every pixel of
  scroll.

Driving it off `scrollTop` rather than off scroll *direction* is what makes it
reversible: scrolling back up re-opens the bar exactly as far as you came
down, and the refresh gesture — which sets `scrollTop` to 0 — re-opens it for
free.

### Tabs slide

Each screen holds a place on a horizontal track — one screen-width per step
from the one being shown — so a tab change is a move, not a repaint, and a
screen keeps its scroll position while it is parked off to the side. The
places have to be assigned before the first paint; leave them unset and all
three sit at `translateX(0)` and the last one in the document wins.

### An answer belongs where the question was asked

A pull that comes back with nothing used to raise a toast at the bottom of
the screen, which is answering somewhere else. Now the brand loader hands its
place in the refresh gutter to the sentence — "You're all caught up" — the sentence
is readable for a second, and then the gutter closes. Same gesture, same
place, one less floating object.

The sentence is green and carries the library's `check-f2` to its left, at 20
with an 8 gap and 14/22 text — the Toast component's own success layout,
because that is exactly what this is: a success message that happens to be
rendered in a gutter instead of a floating box. `check-f2` is a circle with the
tick *subtracted* from it, so as a mask it paints a green disc and lets the
ground show through the tick. That is why it works in both modes without a
second asset: in Light the tick is white because the gutter is white, and in
Dark it is near-black because the gutter is.

### The read boundary

Two rules with the label between them and a real 12px gap either side — not
one line running behind the text — banded top and bottom like a row of its
own, 48 tall. It is the shape every messaging app converged on: Slack's
"New", Telegram's "Unread messages", Discord's rule. A filled band reads as a
*card* and this is not content; a single line with text sitting on it reads
as a line someone forgot to break. What it is is a row that says where you
stopped, so it is banded like a row. Its bottom rule is the next card's top
rule — one line, not two.

It stands on `background/b0` (1710:17910), and so does the gutter a pull opens
above the list. Both are gaps between content rather than content, and letting
the app's own floor show through is what makes them read that way: on the card
ground they were two more white rows in a stack of white rows, and the seam
between "what just arrived" and "what you had already read" is exactly the
thing that has to *not* look like a card.

### One card, one visible feed — measure first, then fold the read

`1796:19551`. A card opens collapsed, and the only block allowed to fold is the
read. The headline, the quote and the media stay whole, because a truncated
quote is a misquote and a cropped chart is a lie.

There is no fixed `573` cap and no assumed `150` shell. A card first renders at
its real width with all content present. Before paint, the browser measures the
full card, the body, and a real Show more row. The current limit is the feed
viewport below its expanded topbar:

    body budget = visible card height − measured non-body height
                  − measured Show more height

The body line height comes from computed style, so device height, font metrics,
text wrapping, media count and quote height all enter through the actual
layout. Fonts trigger one more pass after loading, and viewport changes trigger
a re-measure. A card a person has already expanded stays expanded.

Then three rules:

1. If the full card fits, show it whole.
2. If folding would hide fewer than two body lines, show it whole: adding an
   action row would buy no useful density.
3. Otherwise land on a sentence end while guaranteeing visible body content.
   A first sentence that occupies one, two or three real lines stays complete.
   Only when the first sentence itself exceeds three lines is it shortened on
   line three with an ellipsis.

Sentence segmentation uses the browser's locale-aware sentence segmenter, so
decimals, abbreviations and non-English punctuation do not need a hand-written
list. Older embedded browsers keep the existing conservative full-stop
fallback. The preview is always a prefix of the full read, and `Show more` is
only inserted when content is actually hidden.

### Read the instances, not the master

`Feed Card - Show more`'s master is `Medium/12`. Every instance of it in the
frames overrides that to **`Medium/14`** — and that is the value, which is also
why the row is 22 tall and not 20. Building from the master put this label a
size too small.

At 14/22 the row is exactly one body line, and the label sits at the body's own
size directly under it instead of shrinking away from it. The runtime still
measures the row's rendered height rather than assuming that number. `main/m1`,
Medium, left aligned, no chevron, 1% tracking — the rendered label measures
73.45px against the frame's 74.

This is the second time an instance override has been the real value and the
master has not (the header's and footer's padding were the first). The rule
that falls out: **on this file, the frame is the specification and the
component is a starting point.**

### Expanding is one movement, not a jump

Tapping Show more expands in place: no navigation, no scroll change, and **no
Show less** on the way back — the row is not rendered once the card is open.
That is X's behaviour on mobile, and it is what the board specifies.

The motion is the part worth building carefully. Two things animate together:
the body's height grows to the full paragraph, and the Show more row's height
closes from 22 to 0. So the quote and the media below are pushed down by what
the body gained *and* pulled back up by the 22 the row gave up, in one
continuous movement rather than two. The body already holds the full text when
the transition starts, so nothing re-wraps mid-animation — it is a clip
opening, not a reflow.

Getting the curve right took two passes, and the two failures bracket it.

The first attempt was an ease-out **quad at 300ms**. It was too soft. A quad
leaves the start slowly — 45% of the travel by the quarter mark — and 300ms is
a long time to spend on 110px, so the whole thing read as mushy rather than as
a movement.

The other failure is `--ease`, the pull's own curve: it spends 78% of the
travel in the first fifth of the time and then 240ms arriving, which is a snap
followed by a crawl.

What works is **200ms** on `cubic-bezier(0.2, 0.9, 0.25, 1)`: real velocity out
of the gate, and a short landing rather than a flat tail — the `x2 = 0.25`
matters, because `--ease` has `x2 = 0` and that is exactly what flattens its
ending into a creep. Measured on the running build: 63% of the distance at
30ms, 78% at 50, 93% at 80, and settled by 126–179ms depending on how far the
card had to travel. The row's opacity is quicker still at 90ms, so the label is
gone almost at once and what you watch is the gap it held closing.

`setFolded` takes the direction as an argument rather than existing twice, so
closing is the same three lines as opening and animates the same way — verified
both directions. The design gives an open card no control to close it, so only
the opening direction has a button; the other half is there for the day it
does.

### The count picks the media layout, not the card

There is one media block, and how many tickers the card carries decides what it
draws — which is exactly what the frame's own component names say: `Media = 1`
is the wide tile, `Media > 1` is the scrolling strip of 240 × 135 ones. One
name gets the wide tile, two or three get the strip. No third option, and
nothing to choose per card.

It used to be two block types, `chart` and `chartRow`, and a card could ask for
the wrong one. One did: the CDNS · SNPS card asked for `chart` with two tickers
and stacked two full-width tiles down the card, which is a layout the design
does not have. Deriving it from the ticker count means that particular mistake
cannot be made again.

### The tile is indicative art, and says so

The chart under a card is one of the design's own two pictures — the line
chart, then the candles, alternating down the feed. That is a deliberate step
back from the generated SVG sparkline that stood here for a round.

The sparkline was drawn from the ticker's own low, high and last price, and
that was the problem: it was precise enough to be *read* as this name's tape
while being a seeded walk. A prototype cannot render a compliant Alva chart
image, so the honest move is a picture that is visibly a placeholder rather
than a drawing accurate enough to be mistaken for data. Two pictures
alternating say "indicative" the way one perfect curve per ticker does not.

The turn is a counter the feed resets on every render, so the alternation is a
property of the list's order and the same feed always looks the same. Both
pictures are light-ground, so they keep `--media-filter` and invert in Dark.
There is still one tile per ticker, and it still opens the fullscreen chart —
which is generated, per ticker, and is where an actual tape belongs.

The fullscreen chart generates the ticker's own session rather than scaling one
fixed crash shape to everything, because that shape put "Previous close"
outside the visible range on any name that rose.

### The media frame is a pseudo-element

`inset box-shadow` paints under the element's own content, and the image fills
the tile edge to edge — so the 0.5 frame was in the stylesheet and invisible
on screen. It is an `::after` now, which is later in tree order and therefore
above the image.

### The scroller is the only thing allowed past the gutter

A row of media tiles bleeds through both gutters and is clipped by the screen
itself — see [Media rows are cut by the screen](#media-rows-are-cut-by-the-screen-not-by-the-gutter)
for why that edge, and only that edge, is where a tile may be cut. Nothing
else on the screen crosses the gutter.

### Tracking: the font already has it

The library's text styles carry 1% letter spacing, and the tempting move is
to write `letter-spacing: .01em` and call it a match. It is not: the exported
static Delight TTF already measures that way in a browser, so adding 1% on
top pushes two paragraphs onto an extra line and the cards grow 22px each.
At `letter-spacing: 0` every text block in the frame breaks on the same words
and lands on the same height as the design — 154 / 44 / 132 / 28 / 132, with
the quote at 128 and the cards at 423 / 525 / 581.

### Refreshing: one gesture, two ways in

Pull to refresh is the standing gesture on this screen, not a one-shot
animation. From the top of the list a drag moves the **track** the cards sit
on (the refresh gutter lives at `bottom: 100%` of that track, so it comes
into view with the pull and leaves no gap behind when the list springs
back), the 20px Alva brand loader fades in and turns with the finger, and past
48 the release commits: the list holds open at 64, the loader runs at 720ms
linear for 1150ms, the new cards land while it is still held, and only then
does the list close over them. A list that changed under the eye would be
worse than one that waited.

`Pill · New cards` is that same refresh with a number on it. It sits 8 below
the topbar, centred, on `main/m1` with the library's `Shadow L (10 20 8)` —
the one element on this screen with a shadow, because it is the one element
that is floating. Tapping it runs the identical sequence rather than a second
one.

**There are two cards waiting, and only the first refresh gets them.** Every
refresh after that is the other half of the state a feed has to show: the
brand loader runs, nothing new comes back, and the list says so —
*You're all caught up*. A prototype that always produces content teaches the
wrong thing about a feed.

When the two do arrive, the boundary between them and what you had already
read is marked once, in place, the way Twitter marks it: a hairline with
*You were here* sitting on it, on `content/br03`, 36 tall. It goes in above
the old first card, before the new ones land, and nothing moves it
afterwards.

It also **stays put while you read**. The pill is not a scroll affordance; it
is the count of what is waiting, and that count is still true at the bottom
of the list. It leaves for exactly two reasons: you tapped it, or you pulled
the list yourself. Either way the waiting cards are now in the feed, so the
number has nothing left to say.

### Every stroke is 0.5, and none of them are borders

One token, `--hair: .5px`, carries every stroke on the screen. None of them
are `border` any more: **Chromium rounds `border-width` up to a whole CSS
pixel**, so `border-top: .5px` paints exactly the same line as `1px` — on a
3× phone that is three device rows where the design asks for one and a half.
The hairlines are inset box-shadows instead, which do paint at a half pixel:

```css
box-shadow: inset 0 var(--hair) 0 var(--l12);      /* a top edge      */
box-shadow: inset 0 0 0 var(--hair) var(--l2);     /* a ring, radius-aware */
```

A hairline that costs the layout nothing is also why the cards now measure
exactly what Figma says — 423 / 525.06 / 581 — instead of half a pixel more
each. The ticker divider is a 0.5-wide element with a background; refresh now
uses the Library's 20px four-tile brand loader rather than a stroked ring.

### The line belongs to the top of a card

Cards carry their separator on top, not on the bottom, so the first item in
the list is delimited above as well and the line travels with the cards when
the list is pulled. At rest the first card's own line is switched off,
because the topbar's bottom hairline is already sitting on that exact row and
two 0.5px lines on one row read as a single thick one. Pull the list away
from the topbar and the card takes its line back — that gap needs a top edge
of its own.

### Media rows are cut by the screen, not by the gutter

A row bleeds through **both** gutters — `margin: 0 -16px` with the 16 put
back as padding — so a tile leaving the row is cut off by the edge of the
screen, the only place a cut reads as *there is more over there*. Clipped at
the 16 gutter instead, as it was first built, the tile looked severed in mid
air. And no scroll snapping: this is a strip you graze along, not a carousel
that wants to click into position.

The row keeps its native touch scrolling and `pan-x`, so a swipe never gets
handed to the pull gesture, and it gains a mouse drag for the desktop, where
there is no finger and the wheel belongs to the feed. A drag past 4px is not
a tap, so the click it would have fired at the card is swallowed — the same
rule the pull gesture uses.

### One media ratio

A full-width tile is the same shape as a small one, 240 × 135, so the ratio
is the token and the height follows the device's width (`aspect-ratio`). The
fixed 203 it started with was only ever right at 393; at 402 or 440 the big
tile was quietly the wrong shape.

### Sharpness, and cropping inside the frame

The chart tiles are exported at 3× (the wide one at 2×, see below) and drawn
at 240 × 135 and 361 × 203, so they stay crisp on a retina screen instead of
resampling a 1× crop.

The crop steps **1 design pixel inside the tile**. The Figma frame draws its
own 0.5 stroke and 8 radius, and so does this page: take the export at face
value and both land on top of each other — a doubled edge and a corner
inside a corner. Inside the tile there is only chart, and the page's own
hairline and radius do the framing. (The remaining rounded corner in the
export is cut again by the page's radius, which is the larger of the two.)

### Colour is a role, never a value

Every colour in `mvp.css` is a variable, and every variable is a name from the
library's **Theme** collection — `background/b0`, `content/b10`, `content/br03`,
`line/l07…l3`, `text/n2…n10`, `main/m1…m4`. There are exactly two blocks that
assign them: `:root` for Light and `:root[data-theme="dark"]` for Dark. Nothing
else in the file names a colour, so System, Light, and Dark all use the same
theme renderer rather than carrying separate screen implementations.

Dark mode is not an inversion. The library keeps the accents where they are —
`main/m1 #49a3a6` is the same teal in both modes — and re-grounds only the
neutrals, so the green pill and the amber star do not shift when the paper
does. Three consequences worth naming:

- **Icons are masks, not images.** An `<img>` carries its own colour, and there
  is no way to re-ground it for dark mode without a filter that lies about the
  alpha. Every monochrome glyph is a single-path SVG used as a
  `mask-image` over `background: currentColor`, so it takes whichever `text/n*`
  token its row is already using. One file per glyph, two modes, no duplicates.
  The exceptions are the things that are *supposed* to keep their colour:
  ticker logos, avatars, and the amber `star-f`.
- **The chart is told, not inherited.** A canvas cannot read a CSS variable, so
  the chart reads the computed value of each token in JS and hands it to
  TradingView; flipping the mode re-reads them and restyles in place rather
  than rebuilding the canvas.
- **Screenshot media gets inverted.** The chart tiles in the feed are white-paper
  screenshots. In dark mode they take `invert(1) hue-rotate(180deg)`, which
  darkens the ground and brings the greens and reds back out the same hue they
  went in.

The switch itself lives in **Me → Preferences → Dark mode**, and there is a
second one on the desktop stage for whoever is reviewing. The choice is stored,
and it is stamped onto `<html>` by an inline script in `<head>` — before the
stylesheet loads — so a dark session never flashes the light palette on the way
in. With no stored choice the OS preference decides.

### The two sheets are one object

A scrim, a grabber, a `Topbar/Mweb`, and a body. Neither has a fixed height:
every sheet is as tall as its content and no taller than **40 below the status
bar**, which is the ceiling for all of them. The sources sheet with three rows
is three rows tall; with eleven it hits the ceiling and scrolls. `flex: 0 1
auto` on the scroller is what does the hugging — `1 1 auto` would stretch it
to the ceiling every time.

The ticker sheet always takes the ceiling, because its chart is supposed to
fill whatever is left. Its body is a column with exactly one flexible row in
it — the chart — so the anomaly card lands on the bottom edge without being
positioned there, which is how the design has it (the card's frame sits flush
at the foot of the 700).

Two more details off the frame: the topbar's right button is at x=345 of 393,
not flush, so the star sits **8 in from the edge**; and the sources sheet has a
hairline under its title bar while the ticker sheet does not, because there the
tab strip already draws one.

Sharing the element means only one sheet can be open, the exit animation is
written once, and the chart inside the ticker sheet is disposed of on close
instead of leaking a canvas. The home indicator had to move out of the tab bar
to sit above an open sheet — a child cannot paint above its own ancestor's
stacking context.

The status bar sits *in front* of the scrim, not under it, and goes light while
a sheet is open — the way iOS does it. Fullscreen, the design keeps only the
dynamic island: the two side groups fade out, and the close button lands where
the battery was.

### Type sizes come off the frame, and the frame moves

The sources sheet's excerpt is 14/22, not 12/20 — the frame was updated and
that was the change. Worth knowing that the row's gaps are not uniform
either: the avatar and the byline are one group 8 apart; the time is the sole
right-hand item; and the domain link sits 4px below the excerpt. One flat gap
of 12 puts the handle too far from the face it belongs to.

The quote block's mark is likewise measured, not eyeballed: its box is
29 × 46 at x=327 of the 361-wide tile and y=−5, so it hangs 5 above the tile
and sits 5 in from the right — and the 46px line box on a 64px glyph is what
lifts the glyph that far up inside its own box.

### Sources are simulated, but simulated from the card

Each card carries its own list, and every row is a source that could plausibly
have produced that card's sentences — the excerpt is the line the card is
standing on. The $600M ATM card cites the 424B5 filing, the press release, and
the two people who reacted to it; the download card cites Bloomberg, Reuters,
the earnings call and the Hugging Face trending page. Where the platform is
part of the identity, the avatar carries the badge on its own corner rather
than the row growing a column for it.

### The chart is TradingView's, the styling is ours

`assets/vendor/lightweight-charts.js` — Lightweight Charts 5.2.1, Apache-2.0,
vendored rather than loaded from a CDN so the page keeps working offline and
inside a packaged single-file build. It is the same library the design's chart
module was drawn from: candles, a volume pane, a right-hand price scale and
labelled price lines are all things it already does properly, and a
hand-rolled canvas would only be a worse version of it.

What we own is everything around it:

- **Two charts, one mount function.** The difference is structural, and it is
  one flag. In the ticker sheet there are 250px to work with and the volume is
  an overlay at the foot of the price pane, the way the design draws it.
  Fullscreen there is room for the second pane the design draws instead, and
  the price gets 3.4× the volume's height.
- **The numbers agree with each other.** The session is generated from a seeded
  LCG — the same ticker always draws the same session — and then *scaled* so
  its last close is the price the header quotes. A chart that disagrees with
  the number above it is worse than no chart. The net change steers the drift,
  so a red day slopes down and a green one up.
- **The legend is the crosshair.** O / H / L / C and the volume follow whatever
  the crosshair is over, and fall back to the last bar when it is over nothing.
- **The volume tag is an explicit line, not a last-value label.** A last-value
  label takes the colour of whichever way the final bar went; in the design
  that tag is always the accent.
- **Three labelled lines, in the order they matter.** Previous close in amber,
  the price the event printed at in `main/m2`, and where it is now in
  `main/m3`. That is the entire argument the fullscreen chart makes.
- **The plot runs the whole frame and the status bar sits over it**, per
  1076:48248, and the close button is 18 below the status bar so it clears the
  battery instead of sharing a row with it. The candle pane carries 22% of top
  margin for the same reason: the previous-close line has to land below the
  close button, not under it.
- **The anomaly card is two-tone**, not one: the label rides its own `m2-10`
  strip and the body sits on `br03` underneath it.

### The tab bar's hairline, and the one screen without one

A 0.5 inset shadow on an 82-tall bar lands on a different subpixel at every
device height, and vanished at some of them — which is what "sometimes there,
sometimes not" was. It is a 1px pseudo-element scaled to half from its top
edge now: the deterministic half pixel. Chat has none at all, because the
composer already draws that edge.

Chat's thread also stops at the composer's top edge rather than 12 above it,
so the last line is cut by the box instead of by an invisible line in the
white space over it.

### The device switcher had to be visible to be working

`fit()` measured the *current* device and scaled it to the stage, so every
phone came out the same size on screen: switching from a 402 to a 440 changed
the readout and nothing else, which reads as broken. It measures the largest
device in `DEVICES` now, so all three share one scale — the big phone just
fits, the smaller ones are visibly smaller, and the switcher does something
you can see.

### The Me screen is measured, not eyeballed

Everything on `360:37134` was first laid out from a screenshot, and it showed:
Usage sat hard against the profile header, the credits card was ten pixels too
tall, the icon-to-label gap was 12 where the component says 8. The frame has
real numbers and they are all multiples of the spacing scale, so the second
pass took them off the file instead:

| what | where it comes from |
| --- | --- |
| 16 between the header and the menu | `Menu` starts at y 92, the header ends at 76 |
| 54 per row | `List Item/L` is 22 tall with 16 above and below |
| 8 icon → label, 4 count → chevron | the `List Item` component's own gaps |
| 64 credits card, 8/12 in | `Credits Card` and the `Available` frame inside it |
| 2 between "Available" and the number | 16-tall label at y 8, 34-tall value at y 26 |
| 16 after the card | `Usage Entry` has 16 of bottom padding under it |
| 12 / 4 around a group label | the `Group ·` frame is 32 with a 16 label at y 12 |
| 16 above *and* below the social row | `Social` is 64 with 32-tall buttons at y 16 |

A stroke or a fill that exists in the file is not the same as one that is
painted, and reading `strokes` and `fills` without checking each paint's
`visible` cost a round here: the Social frame's top rule, its buttons' 5% fill
and the `Usage Entry`'s top rule are all switched off in the frame, and all
three got built. The buttons are a hairline outline on the card's own ground,
the social row is separated by space rather than a rule, and nothing draws a
line above Usage — the profile header is held off it by 16 of space instead.
The row hairlines that *are* on are the ones on the seven menu rows.

And the appearance row is 54 like the rest even though the switch in
it is 24 in a 22 line: the extra pixel either side comes out of the switch's
margin rather than the row's height, because a settings list where one row is
two pixels taller than its neighbours is a list you can feel is wrong without
being able to say why.

### What is not built yet

The buy mark on the ticker sheet's chart is a plain circle. The design draws a
circle with a **B** inside it, and Lightweight Charts puts marker text outside
the shape rather than in it; a stray B hanging under a dot reads worse than no
letter, so it is a dot until someone writes a custom series renderer for it.

Inside the ticker sheet, Overview is real and the other five tabs
(Narratives, Anomalies, News & Social, Smart Events, Financials) name
themselves. On Chat, the thread is the design's own transcript and the
composer is presentational. Everything else that points at a screen nobody has
built says so once, in a toast, rather than doing nothing at all.

## Alpha Radar — the 2026-08-18 design round

Everything below applies to the three source-selection screens (FinTwit accounts, key figures, podcasts) and the Ready screen.

### One collection per screen, and a split read-out

Each screen now carries **one** collection card, not two — `Most Followed 50` is gone. The selection read-out **names the collection and counts the individuals**, joined with a plus:

The selection-screen footer says it in words (Regular/12, centred, `text/n5`):

| | |
| --- | --- |
| Collection only — **the default** | `Win Rate Top 50 selected` |
| Both | `Win Rate Top 50 + 12 FinTwits selected` |
| Individuals only | `12 FinTwits selected` |
| Nothing | `0 FinTwits selected` |

The individuals on the first screen are counted as **FinTwits**, not accounts. The screen's own title, description and the collection's `50 accounts` meta still say "account" — that is what the design file has, so it is what the demo has.

Naming the collection instead of adding its 50 also settles the old double-counting question: someone who is both a collection member and checked in the grid is counted once, as an individual, never twice.

**Skip is a permanent fixture in the top right** of all three source steps, selected or not; only the editing pass hides it, because Confirm is the exit from that. An empty page reads as a count — `0 FinTwits selected` — rather than an instruction, since Skip is right there as the way out.

**Each picker opens with only its collection card checked.** The curated collection is the default; every individual is the user's own addition, so the `+ N accounts` half of the read-out counts what they actually did rather than a number the demo pre-filled. The design file's `12 accounts` / `8 key figures` / `5 podcasts` are therefore a demo state you reach by checking people, not the state the screen opens in.

The design file adds filler cards so no grid row is left holding two stretched cards. That is an artifact of Figma auto-layout, where the cards are FILL children — this grid is `repeat(3, minmax(0, 1fr))`, so a short last row keeps its column width and no filler is needed.

### Ready screen row is composed, not labelled

On the Ready screen the plus moved out of the sentence and into the row ([13223:47199](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=13223-47199)). The row is `collection collage avatar` · `+` · `individuals' avatar stack` · `count` · pencil — gap 8, 24px content, 56 tall — so the collection is carried by its avatar and the words are only the count. Straight out of onboarding, with only the collections checked, each row is the collage plus the collection's name; the plus and the stack appear as soon as you add people.

Both avatar groups are live: the collage is the collection's own four images, and the stack is the first four individuals you actually picked, in the order the list holds them, so the row keeps up as you edit.

The whole row opens its picker — the pencil is a cue, not the target — and it has row-sized press feedback to say so, painted by a layer that reaches the card's inner edges and takes no space so nothing shifts on press. The pencil renders `alpha-edit.svg` at the glyph's own 11.63 × 12.07 with the design's 16px icon box expressed as the margins either side; forcing the glyph itself to 16×16 blew it up 37% and stretched it unevenly, since that asset carries `preserveAspectRatio="none"`.

The file draws two of the four states. The one-sided ones are inferred, on the rule that the words say whatever the avatars cannot — with a collection alone the words become its name, with individuals alone they stay the count. Note that "collection alone" is now the opening state, so it is on screen more than the file's drawn one.

### Ready screen empty row

A category with nothing selected stops being a row-with-an-action and becomes the action ([14159:48746](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14159-48746)): the grey label and the pencil both go, and one centred text button carries the row — `⊕ Add podcasts`, **Medium/14** in `main/m1`, `add-l1` at 16px, gap 8, no fill and no pill. 16 + 22 + 16 makes it 54 tall, a little tighter than the 56 of a filled row, whose avatar is 24. Tapping anywhere in the row still opens that picker.

`add-l1` is a **plus inside a ring**, not a bare plus, so `assets/add-l1-m1.svg` holds that node's own exported path bytes (16px box, ring at 5% inset, `main/m1`). It is not `icon-add.svg` recoloured — that glyph is the bare plus, and the first pass at this row used it.

Reaching that state needed a rule the design file does not state. Walking **forward**, a step still requires at least one source, as before — a radar that reads nothing is not a radar. But coming back from Ready via the pencil, **Confirm accepts whatever you chose, including nothing**: clearing a category is a legitimate edit, and it is the only path to the empty row that does not change what Skip means.

### Change → selection sheet

Both rows of the delivery card open the same bottom sheet ([14236:48905](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14236-48905)). Its height has two bands and this is the shorter one: **content height, capped at half the viewport** (852 → 426). The cap is the cross-checked convention — iOS's medium detent is "approximately half the height of the screen", Material's `halfExpandedRatio` defaults to 0.5, Flutter caps a modal sheet at 9/16 — and it keeps the list inside the thumb's reach. It is a ceiling, not a fixed height: three languages hug at 236, twenty-four hours hit 426 and scroll, cut by the window with no bottom backing, exactly as the collection sheet is.

Container: `main/m7` scrim, 12px top corners, grabber, then a `[✕ | title | qualifier]` header — 52 tall, gap 12, Medium/18. The list is padded 8, each row 46 tall with 12 of its own padding (so text lands on the 16 line) and a 4px radius; the selected row is `main/m1` at 8% with a `main/m1` label, which is the Library's `Select=Yes` variant rather than a tick.

Three decisions the frames imply rather than state:

- **Whole hours only, and the zone stated once.** A picker offering 20:15 asks a question nobody answering "when should the digest land" wants to think about. `GMT+8` qualifies the whole list, so it reads once in the header instead of 24 times down the rows; the Ready row joins the hour and the zone back together.
- **It opens on the value you already have.** 20:00 is the twenty-first row of twenty-four. Scrolling to find where you already are is work the sheet can do itself, so the list is positioned — not animated — before it arrives.
- **Languages are named in Latin script.** Delight carries no CJK, so 「中文」would fall back to another face mid-list. Whether to use native names is still Robert's call, and it depends on adding Noto Sans SC.

Tapping an option commits it and closes. ✕, the scrim, **a drag down** and Esc all leave the value exactly as it was; a pull shorter than a quarter of the sheet springs back, so a half-hearted drag costs nothing. Only the grabber and the header start a drag — a finger that came down on the list is scrolling it. Dismissal is the entrance played backwards, on the same mirrored curve as the collection sheet.

The two `Change` rows now answer a press the way the summary rows do, with a tint that reaches the card's inner edges and takes no space, so nothing shifts.

### Collection member sheet

Tapping now works by card type:

- **Single card** — whole card = select / deselect, unchanged.
- **Collection card** (the 2×2 collage) — whole card = open a **member bottom sheet**; it no longer toggles.

The sheet follows the finalized frames ([⑥ unselected](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14144-48617) / [⑦ selected](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14144-48781)): scrim over the app (never over the status bar or home indicator), sheet from y 106 with a grabber, **close on the left** of the header next to the title, and the collection's inclusion rule ("Highest prediction win rate over the past 90 days · Updated 3 hours ago") as the first line of the scroll area — Regular/14 in `text/n7` — so it scrolls away with the list. Members render as the page grid's own 3-up card molecule and are read-only — the collection is atomic, so the only action is the floating dual-state button: **Follow all** (primary) ⇄ **Following** — white body, a 0.5px `main/m3` hairline, a `main/m3` label and a filled `check-f2`, per [14157:212995](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14144-48781). The hairline is an inset shadow rather than a border so the button stays exactly 48 tall. It toggles in place and the card's checkmark and the selection count behind the scrim stay in sync live; the sheet itself stays put, so you can read the list after deciding. Dismissing is the ✕, the scrim or Esc — never the button.

The sheet's button sits at the same height as every other screen's bottom button (34px home indicator + 16px). Its shadow used to be cut off at a hard line 34px up — not by the sheet, but by the home indicator, which was an opaque white bar sitting above it (z 25 vs 18). That bar has no fill now: every screen already pads its scroll area 34 + 92 off the bottom, so nothing passes behind that band, and the surface underneath is white anyway.

Dismissal is the entrance played backwards. `visibility` cannot tween, so it is held for the 0.38s of the slide — otherwise dropping the `open` class hides the sheet on the spot and the exit animation never runs. The easing is the *mirror* of the entrance curve (`cubic-bezier(1, 0, .68, .28)` against `cubic-bezier(0.32, .72, 0, 1)`): reusing the entrance's ease-out on the way out put 92% of the travel in the first 37% of the time, which read as a snap rather than a reversal.

In the demo, members are drawn from the screen's own account list (Win Rate Top 50 really is the 50 highest win rates), rather than the design file's placeholder loop of 7 mock accounts.

**Still open** (carried over from the design file): the file's per-screen individual counts (12 / 8 / 5) no longer describe a default, since the pickers open with the collection alone.

## Intro screen · the two height tiers

The intro screen is the model for an adaptive screen here, so it is worth
reading before you build one. Everything below its teal stage is fixed —
Hero 270, CTA 80, home indicator 34, **384** in total — and the record card is
always 380 and always sits on the stage's bottom edge. That makes the stage
the only elastic part, and **where its surplus goes is the whole design.**

The gap above the card never shrinks below **the status bar's height plus
16**, which is what keeps the white card from ending up under the OS clock.
At a 62pt bar that floor is 78, so the critical viewport is
`78 + 380 + 384 = 842`:

| Tier | Viewport `H` | Stage | Card |
| --- | --- | --- | --- |
| **完整档** | `H ≥ 842` | `H − 384` | whole 380, surplus opens above it |
| **压缩档** | `H < 842` | `H − 384` | bottom cropped `842 − H` |

The three demo frames draw no status bar, so their labels are the
status-bar-less case — floor 16, critical 780, crops of 18 and 120. On a real
62pt device those same viewports crop 80 and 182. Two of the frames
(`:213106` cropped 18, `:212889` cropped 120) are samples of the *same* tier,
not two tiers.

Figma: [完整档 430×932](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14207-213002)
· [临界前 393×762](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14207-213106)
· [低于临界 393×660](https://www.figma.com/design/DJ9Acp13FruTilsTdrE0id/Draft?node-id=14207-212889)

Four properties carry it, and each one is load-bearing:

```css
.intro-stage { flex: 1 1 auto; min-height: calc(var(--status-h) + 16px); overflow: hidden; }
.intro-safe  { flex: 1 0 0;    min-height: var(--status-h); }  /* the bar's own space */
.intro-gap   { flex: none;     height: 16px; }                 /* clear of the chrome */
.record-card { flex: none;     height: 380px; }
```

**Two blocks above the card, because they are two different things.**
`.intro-safe` is the status bar's own space and its minimum *is* the bar's
height; `.intro-gap` is the 16 that keeps the card clear of the chrome rather
than flush against it. The safe block is also the one that grows, so on a
tall screen the surplus opens up there.

That minimum is measured, not assumed. This is a full-screen app: the bar
does not push content down, it sits on top of it (`position: absolute;
top: 0; z-index: 20`), so whatever the layout does not reserve, the bar
covers. Force `.intro-safe`'s minimum to 0 and the card's top edge goes under
the clock on any device shorter than about 826 — at 393 × 812, a 13 mini, by
**14px**; at 780 by 46; at 764 and below by the full 62. It only looks safe
on the tall devices because their surplus already exceeds 62.

- **`flex: 1 1 auto` on the stage, not `1 0 auto`.** Shrink has to be on, or
  the stage never goes below its own content height, the crop tier never
  happens, and the screen starts overflowing early instead. This is the kind
  of bug where the tall case looks perfect and only the short case is wrong.
- **`flex: 1 0 0` on the gap** (grow, *never* shrink) is what sends the
  surplus above the card rather than below it. At 430 × 932 that is 168px of
  teal; at 440 × 956 it is 192.
- **The floor is `var(--status-h) + 16`, never a literal.** The bar's own
  height so the card starts below the OS chrome instead of under it, and 16
  more so it clears it rather than sits flush. It has to be the variable
  because the shell writes each device's real inset into it and a real phone
  supplies its own — a literal 62 would be right for three devices and wrong
  for every other. Measured at a 62pt bar: 402 × 842 gives gap 78 / crop 0,
  402 × 812 gives gap 78 / crop 30, and the clearance between bar and card is
  16 at every height. It used to be −11 at 393 × 812.

Two consequences worth knowing:

**The CTA is in flow on this screen**, not the pinned `.action-bar` every
other screen uses. `CTA · 吸底` means "last in the stack, hugging the bottom",
not `position: fixed` — below the critical height the *whole page* scrolls,
CTA included, which is what `整页可滚` says.

**The headline carries no `<br>`.** A forced break is a width-derived literal
in the same family as a fixed height: 393 breaks after "around" and 430 breaks
after "what", and both Figma frames reproduce only if the text is allowed to
wrap. It has to stay two lines at every width, though — the Hero's 270 is what
the stage's elasticity is measured against, so a third line would move every
threshold.

## How the single page holds together

Each prototype runs in its own `<iframe>`, and the shell mounts exactly one at a time.

That is deliberate, not a shortcut. The prototypes are full-screen apps that own their document: they set `body { overflow: hidden }`, position themselves `fixed`, and both use the same class names (`.screen`, `.toast`, `.sheet`, `.phone`) and the same element ids. Loading two of them into one document would have them overwrite each other. Giving each its own document means a new prototype can never break an existing one, and each stays openable on its own URL.

**The iframe is laid out at exactly one phone screen** — see the device switcher below for which. So the prototype always sees a real phone viewport: its own `vh`, its own media queries, its own full-screen mode. The iPhone bezel around it on desktop is drawn by the shell, outside the iframe, and only the bezel is scaled to fit the window — never above 1:1. Inside the iframe the prototype is always in its bare full-screen mode, which is why the phone layout needed nothing removed: there was never a mockup inside it to remove.

## One object has depth

The shell is deliberately flat, and there is a rule behind it: **the mockup is
the only thing on the page allowed to have depth.** Everything else is a flat
surface separated by hairlines.

It used to carry five gradients — two teal radials on the stage, one on the
sidebar, and two vertical washes — plus shadowed, rounded, gapped cards in the
list and translucent blurred pills in the chrome. All of it was atmosphere,
and atmosphere everywhere is the same as atmosphere nowhere: the phone had
nothing to stand out against.

The reference for the shape of it is [aspensearch.com](https://www.aspensearch.com):
a hard grid of full-bleed cells divided by hairlines, zero radius, and — the
rule that drives the rest — **the cell IS the control.**

- **A target fills its container.** A list row is the row, edge to edge, not
  a card inset inside one. A toolbar control is a full-height cell, not a
  pill floating in a band.
- **Never a small button inside a container that has nothing else in it.**
  If the container holds only the control, the container *is* the control;
  otherwise you have drawn decoration with a target hidden somewhere in it.
  This is the single easiest thing to get wrong here and it was wrong twice
  before it was written down.
- **Radius 0 on chrome.** The phone keeps its radii — it is a device, not
  chrome.
- **The target carries no border of its own.** Hairlines belong to the grid:
  a row's divider, a cell's leading edge. A border on the control itself
  makes it a box inside a box.

So, if you add chrome here:

- **There is one ground, not several surfaces.** `--ground: #f7f7f7` on the
  body, and the sidebar, stage and toolbar set no background at all — they
  are one surface with hairlines drawn on it. No gradient, no blur, no
  translucency.
- **The ground is not white, deliberately.** The phone's screen is the only
  white thing on the page; that is what makes it read as the object rather
  than as another panel.
- **No cell is wider than what is in it.** The Figma cell used to take all
  the toolbar's slack — an 800px target holding 200px of text, which is the
  same shape as a small button floating in a big container, just rotated. It
  sizes to its label now and the leftover width is simply ground, which is
  why it needs a right edge of its own.
- **Two backgrounds differ from the ground, and both mean something:** the
  selected list row (`--l07`, landing on `#e6e6e6`) and **Restart**, which is
  solid black. Restart is the only cell in the toolbar you press to change
  what is *on screen* rather than what you are *looking at*, so it is the
  only one that looks pressable. Nothing else fills — not hover, not an open
  dropdown trigger, not a hovered toolbar cell. A second fill appearing
  under the cursor competes with the one that means something, and reads as
  selection wherever the pointer happens to be. Hover on a row underlines its
  title instead; the rows are links, so that is the honest affordance and it
  costs no colour.
- **`--ground` is flat, not a token over white.** It is `background/b0` with
  `content/br03` composited, written once as a value, because the dropdown
  menu has to be opaque — an overlay cannot be translucent or the toolbar
  reads through it — and deriving the page and the overlay from two different
  expressions of the same colour is how they drift apart.
- **Hairlines separate things**, not gaps plus borders plus shadows plus
  radii — and there is **one** stroke colour, `var(--line)`. Two weights
  (inner vs structural) read as some dividers mattering more than others,
  when on a page with a single ground they all do the same and only job.
- **State is carried by fill and text contrast**, not by added chrome. An
  unselected row is `--n7` / `--n5` and goes `--n9` on hover over `--br03`;
  the selected one fills with `--l07`. Two steps of one token family — no
  edge marker, no rule, no border.
- **Chrome type is the micro-label register**: uppercase, 11px, `0.04em`
  tracking. It reads as a toolbar rather than as a row of buttons.
- **The one shadow left is the phone's**, and it is one soft drop rather than
  the two atmospheric ones it had. On a flat ground a single shadow reads as
  "this floats"; a stack of them reads as "this page is glossy".

Dropping the blur had a second effect worth noting: the chrome's text could go
back to design-system tokens. The old `rgba(23, 32, 34, 0.55)` on a translucent
fill measured **3.7:1** — under AA. It is `var(--n7)` now, at 8.5:1.

## Collapsing the list

**One control per state, and it is the one that state needs.** The two
states need different things, so they get different controls:

| State | Control | Why |
| --- | --- | --- |
| Expanded | `«` at the header's far end | The affordance has to be **discoverable**. Nobody guesses that a wordmark collapses a list. |
| Collapsed | the wordmark itself | The list is gone and the mark is all that is left, so clicking it is the obvious way back. A glyph beside it would be decoration. |

The inert one is `disabled`, not `pointer-events: none`, so it also leaves
the tab order — there is exactly one tab stop in the header in either state,
rather than a focus stop that appears to do nothing.

`«` is a text glyph rather than an asset because this shell already speaks
that way: the Figma cell ends in `↗` and the device cell in `▾`. There is no
clean chevron in `assets/` — they are all 45° corner arrows — and drawing one
is exactly what the icon rule forbids.

Collapsed, the column is **zero**, not a rail. A rail is still a column: it
would push the phone off-centre by its own width in exchange for showing
nothing. The mark leaves the flow instead (`position: absolute`, which is
also why the sidebar stops clipping) and stays at exactly 20/20 in both
states, so it never appears to move. Phone centre and window centre agree to
the pixel when collapsed.

The state persists. Below 900px there is nothing to collapse, so the mark
stays as brand but stops being pressable — otherwise a tap there would store
a collapsed state that only took effect the next time the page was opened on
a desktop.

It replaced an **Open standalone** cell, which opened the prototype
full-screen in its own tab. That is not something a gallery whose whole
point is the mockup in context has any use for — and the top-left of a
two-pane layout already has an obvious job.

**The mark is sized to the title's cap height, not to its font size.**
"Mobile prototypes" at 16px Medium measures 11.4px cap and 14.8px ink; the
mark was 18, which is 1.57× that cap and read as a bigger thing sitting
beside smaller text. `--mark-h: 12px` puts them level — measured ratio 1.05,
and the mark, the title and `«` all land on an optical centre of 26.

It still sits 20 from the top to match the 20 every block carries on the
left, but the padding is `calc(20px - (24px - var(--mark-h)) / 2)` rather
than a number: the header row is 24 tall and centres the mark, supplying the
rest. Written as the subtraction so it survives the mark changing size.

## Searching the list

The field under the header filters on **the title, the subtitle and the meta
line** — everything the row actually shows — so what you searched for is
visible in what came back, rather than a row matching on something you
cannot see. Case-insensitive, `Esc` clears, and the footer switches from
"2 prototypes · …" to "1 of 2 prototypes" while a query is active. No match
gives a real sentence naming the query, not an empty list.

**Filtering never touches what is mounted.** A prototype you are looking at
stays on the stage even when the query hides its row: this is a way to find
things, not a way to navigate, and unmounting the stage because a search box
stopped listing it would be the search deciding something it was not asked
about.

The field is bare — no border of its own, no radius, no fill, filling its row
edge to edge. Focus is a teal rule along the bottom edge, drawn as an inset
shadow so nothing shifts, because a fill would compete with the selected row.
The UA's clear button is suppressed: it is a small control inside a field,
which is the shape this shell keeps removing.

## The device switcher

The stage's bottom-right control sets which iPhone the mockup is, so a layout can be read at more than the one size it was drawn at. It is global: the size outlives the prototype you picked it on and survives a reload, because "how does this hold up at 6.9 inches" is a question you ask of the whole gallery, not of one screen.

| | Points | Safe area |
| --- | --- | --- |
| **iPhone 17** — the default | 402 × 874 | 62 top · 34 bottom |
| **iPhone Air** | 420 × 912 | 62 top · 34 bottom |
| **iPhone 17 Pro Max** | 440 × 956 | 62 top · 34 bottom |

Logical points, portrait — the resolution a layout actually sees, not the pixel count. The 17 and the 17 Pro Max carry the 6.3″ and 6.9″ displays forward unchanged; the Air's 6.5″ is the size that is new this generation.

**The insets are the part that makes this more than a resize.** Both prototypes were built at 393 × 852, whose top inset is 59 — and all three devices here are taller-island ones at 62. A 402-wide frame still padded to 59 would not be an iPhone 17, it would be the old phone stretched, and every screen's content would start 3px too high. So the shell writes the device's insets onto the prototype's own root (same origin, so an inline custom property beats its stylesheet's `:root`). The two prototypes name that variable differently — `--status-h` in Alpha Radar, `--sb-h` in the immersive onboarding — so both are set.

Below 900px none of this applies: there is no mockup and no switcher, the prototype is running on whatever phone is actually in someone's hand, and the overrides are removed so its own values take back over. Handing a real device a chosen device's insets would be worse than not choosing.

**Switching never remounts the iframe.** Remounting would throw away which of the eight screens you are on, and comparing *the same screen* at three sizes is the whole point — so the frame is resized underneath a running prototype and its own layout does the rest. Restart still remounts, and the device survives it.

Two things fell out of building it, both of which had been hardcoded guesses that were only ever right for the row that existed when they were written:

- The stage's reserved bottom band was a flat 62px. It is now measured from the taller of the two chrome bars, because a narrow window wraps the right one onto a second line and the phone was being overlapped.
- Each bar was capped at `50% - 24px` of the stage. The right bar now takes whatever the left one is not using, which keeps it on one line down to about 1050px instead of wrapping on every laptop.

**Not covered:** a prototype opened standalone still draws its own 393 × 852 mockup. The switcher is shell chrome, and standalone mode is by definition outside the shell.

**Routing is the hash.**

| URL | |
| --- | --- |
| `#/` | the list |
| `#/alpha-radar` | that prototype, running |

On desktop both halves are on screen at once, so `#/` resolves immediately to the newest prototype — a blank right half is never a useful state, and the redirect uses `replaceState` so it does not become a history entry the user has to press back through. On a phone the two views are separate and each selection is a real history entry, so the browser's own back gesture is the way back and the page does not need to invent a back button.

Selecting a prototype mounts a **fresh** iframe element rather than reassigning `src` on an existing one: setting `src` before the node enters the document adds no history entry, so back keeps meaning "back to the list" instead of stepping through prototypes the user never chose. It also gives a guaranteed clean reset, which is what **Restart** uses. Returning to the list on a phone unmounts the iframe, so a prototype's timers and animation loops do not keep running behind it — and coming back gives a fresh flow rather than a half-finished one.

## Adding a prototype

Three things to write, and one contract to keep. The three things are
mechanical. The contract is the part that is easy to get wrong, so it has its
own section below — read it before you draw anything.

### 1. The files

Drop `your-prototype.html` plus its own CSS and JS into this folder. It keeps
its own document, so it can use any class names and any globals it likes —
including the same ones another prototype already uses.

### 2. Two lines, so the shell can own the mockup

In `<head>`, **before** the stylesheet:

```html
<script>if (window.self !== window.top) document.documentElement.classList.add('embedded');</script>
```

And in its CSS, an `html.embedded` block that strips its own mockup — copy the
one at the bottom of `alpha-radar.css`. It sets the bezel wrapper to
`width/height: 100%`, no padding, no radius, no shadow, and hides the phone
buttons and the standalone pills.

**Why both this and a `max-width: 520px` media query?** They cover different
situations, and a prototype needs both:

| | Fires when | Covers |
| --- | --- | --- |
| `html.embedded` | the page is in an iframe | running inside this shell, at any device size |
| `@media (max-width: 520px)` | the viewport is phone-narrow | opened directly on a real phone |

The media query alone *looks* sufficient today, because every device in the
switcher is 402–440 wide and so passes 520. That is a coincidence, not a
design: add a wider device — an iPad, a landscape phone — and the media query
stops firing while the page is still embedded, and the prototype starts
drawing a phone mockup *inside* the shell's phone mockup. `html.embedded` is
what makes that impossible.

### 3. One entry in `PROTOTYPES` in `shell.js`

```js
{
  title: 'Your prototype',
  subtitle: 'One line on what it explores.',
  edited: '2026-08-18',
  href: 'your-prototype.html',
  meta: 'Mobile · 4 screens',                        // optional
  figma: { label: 'Frame name', url: 'https://…' },  // optional
}
```

The route slug comes from `href`, so `your-prototype.html` is reachable at
`#/your-prototype`. The list sorts by `edited`, newest first, and renders the
time the way design tools phrase it (`Edited today` / `Edited 3 days ago` /
`Edited Aug 12`). Nothing else needs to change, and nothing you add here can
affect a prototype that already works.

## The contract: no length may be a slice of the screen

This is the one rule that is not obvious, and the one the device switcher will
catch you on.

A prototype here does not run at one size. It runs at 402 × 874, 420 × 912 and
440 × 956 inside the shell, and at whatever a real phone gives it when opened
directly. **So no length in your CSS may be a number you measured off the
Figma frame's height.** Concretely:

**Never write a height that means "this much of the screen".** Let the
container flex, or anchor with `top`/`bottom` insets, and let the content
decide. A `height: 469px` lifted from an 852-tall frame is correct at exactly
one viewport and silently wrong at every other — and the failure is not a
crash, it is a band of dead space that grows linearly with the viewport, which
is exactly the kind of thing that survives review because every individual
number in the file is the number the design file says.

```css
/* wrong — 469 is a slice of an 852-tall frame */
.intro-stage { height: 469px; padding-top: 112px; }

/* right — the stage takes what is left, and the card is anchored in it */
.intro-stage { flex: 1 0 0; min-height: 0; overflow: hidden; }
.intro-spacer { flex: 1 0 0; min-height: 16px; }
.record-card  { height: 380px; }   /* the card's own size, not the screen's */
```

A fixed height is fine when it is **the drawn object's own size** — a 380px
record card, a 272 × 560 product-proof mini phone, a 1981 × 580 background
texture. It is not fine when it is a share of the viewport. The test is one
question: *if the phone got 80px taller, should this number change?* If yes,
it must not be a literal.

**Name your safe-area insets as custom properties on `:root`.** The shell
writes the mounted device's real insets onto your document, and it can only do
that if the value has a name to override:

```css
:root {
  --status-h: 59px;   /* or --sb-h — the shell sets both */
  --home-h: 34px;
}
```

Use `var(--status-h)` / `var(--home-h)` everywhere the OS chrome takes space —
never the literal. Every device in the switcher is a 62pt-inset one, so a
prototype that hardcodes 59 renders every screen 3px high and no amount of
resizing will fix it. (If you need a third name, add it to `SAFE_TOP_VARS` /
`SAFE_BOTTOM_VARS` in `shell.js`; below 900px the shell removes the overrides
instead, so your own `:root` value is what a real phone gets.)

**Check yourself before shipping:**

```bash
grep -nE '^[[:space:]]*(height|min-height|max-height):[[:space:]]*[0-9]{3,4}px' your-prototype.css
```

Every hit has to be a drawn object's own size. Then open the prototype in the
shell and click through all three devices on one screen — not three screens at
one device. The bug you are looking for is a gap that grows.

**The worked example** is the Alpha Radar intro screen, which used to be
`height: 469px` — that is 852 − 384, right at exactly one viewport. It now
implements the three height regimes below; read it if you need a model for an
adaptive screen.

## Run locally

Any static server over this folder works; the shell needs same-origin so the
device switcher can reach into the iframes, so `file://` will not do.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Under an agent sandbox `python3 -m http.server` can fail on `os.getcwd()`; use
the `onboarding-demo` entry in `alva-freshman/.claude/launch.json`, which runs
a small node static server instead.

---

# Immersive onboarding

`01 Welcome` → `02 Choose your first task` → `03 Choose who Alva reads` → `04 Confirm & generate` → `05 Success (auto-advances ~2s)` → `06 First digest & alerts`

## Motion semantics

Every transition maps to what is actually happening, following Apple's system motion language:

| Moment | Motion | Why |
| --- | --- | --- |
| Drill deeper (Get started, task row, Next, Skip) | Navigation **push**: incoming slides from the right; outgoing parallaxes −30% under a dim layer (`cubic-bezier(0.32, 0.72, 0, 1)`, 500 ms) | Spatial travel deeper into a hierarchy |
| Go back (back button, `←`/`Esc`) | Navigation **pop** — exact reverse | Returning along the same spatial path |
| Edge-swipe back | Finger-tracked interactive pop, cancellable below 32% progress; a press that never moves is treated as a tap so edge-zone controls still work | UIScreenEdgePanGesture behavior |
| Confirm & Generate → Success | **Cross-dissolve** with a slight settle (no push) | A commit is a state change, not spatial travel — and there is nothing to swipe back to |
| Success → First digest | Cross-dissolve + **navigation stack reset** | Onboarding is dismissed; you cannot navigate back into a completed flow |
| Alert-time / language pickers | Bottom sheet with a soft spring, drag-to-dismiss, tap-outside-to-cancel; selection shows its checkmark before the sheet closes | Transient choice presented modally |
| Next CTA on Sources | Slides up from the bottom edge on first selection | A new affordance enters from the edge it belongs to |
| Out-of-scope taps | Toast HUD dropping from below the Dynamic Island | Transient, non-blocking status |

System chrome — the status bar and the home indicator — is global and fixed. It sits above every screen, never travels during a push/pop, and never animates, because it belongs to the OS rather than to any screen. Inside a screen only one region scrolls: the top bar and the bottom bar hold still while titles, search fields and lists scroll past them, and the top bar grows a hairline divider the moment content passes underneath it (iOS scroll-edge effect).

A transition's completion is armed independently of `requestAnimationFrame`, so a throttled frame can never leave the app wedged mid-navigation. `prefers-reduced-motion` collapses everything above to instant transitions.

## Interaction spec, per screen

**01 · Welcome** — `Get started` pushes into the flow. `Log in` is outside the demo and says so via toast. The product-proof phone is a full HTML/CSS reconstruction (chat, screener table), not a bitmap, and carries the hero's drop shadow so its white body never merges into the white section below.

**02 · Choose your first task** — the FinTwit row (`Track FinTwit, news & technicals` → `Choose sources`) is the one wired into the following steps. The other four routes are rendered exactly as designed but stay inert until their own flows are built. `Skip` = accept the default task and continue.

**03 · Choose who Alva reads** — every avatar is a true circle, presets rendered as 2×2 collages; the selected badge is the square exported asset. The search field really filters (name, handle, or group; empty state echoes your query). Tapping a card toggles selection with a springy checkmark; the `Next` CTA slides up with the first selection and retreats if you clear it. Selection state survives navigation — remove a chip on 04 and come back, the grid agrees. `Skip` = continue with the production default source set.

**04 · Confirm your digest** — chips mirror your selection (or the Figma default set of 13 when skipped); removing one animates out and syncs back to screen 03. Removing *all* chips reveals an explanatory empty state and disables the CTA (tapping it then tells you why instead of failing silently). Alert time and language open bottom-sheet pickers.

**05 · Success** — transient and celebratory. The icon's spring pop and the copy's rise are armed *before* the cross-dissolve begins, so the screen has exactly one entrance rather than appearing, resetting and animating again. Auto-advances after ~2.1 s; no back gesture, by design.

**06 · First digest & alerts** — the destination. Telegram / Discord / WhatsApp simulate a connect: pressed → `Connecting…` → outlined `Connected` state plus a confirmation toast. Everything else visible but out of scope (tabs, menu, settings, full report, chatbox) answers with an explanatory toast rather than dead silence. The nav stack was reset on arrival, so the completed onboarding is unreachable.

---

Built with Claude from the Figma designs. Motion & flow prototypes, not production code.
