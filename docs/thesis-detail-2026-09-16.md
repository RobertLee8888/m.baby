# Thesis Detail, September 17

Reference: [detail state set 5628:93373](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7?node-id=5628-93373).

## Implementation

- The 56px topbar keeps the author identity visible. Visitor pages reuse Follow;
  owner pages use the supplied blue Update control and more menu.
- The latest update uses the Figma 24px rail, 14px node, date/status row, source
  links, original media and ticker components. A thesis without history omits
  the rail and the View all action.
- View all opens a secondary page through the existing navigation stack. It has
  no detail footer. Updates expand in place; Show less remains available as a
  floating 28px action when the inline control scrolls away.
- Signals and Related theses share the sticky 32px tab component. Signals use
  the supplied source boxes and Alva identity. Related theses uses the shared
  cards or the supplied empty state. A newly created owner thesis shows the
  generating state rather than an invented signal.
- Owner archive/private states and authored demo updates persist locally under a
  separate owner key, so they never mutate a same-key public Feed item. Shared
  owner links preserve the owner identity. Old version links open the latest
  update and show the supplied redirect toast.
- The fixed 43px footer contains Ask Alva, bookmark count and Share. Native
  mobile has no simulated status bar or home indicator.

`mvp-thesis-detail.js` owns detail state and actions;
`mvp-thesis-timeline.js` owns the shared timeline and All updates page; and
`mvp-thesis-versions.js` owns supplied historical records. Cards, media,
identities, Follow, bookmark, Sources, tickers, page transitions and sheets
reuse existing components.

## Content Boundaries

The layout is applied to existing theses without replacing their author, copy,
dates, chart bitmaps or tickers with the reference frame's sample content.
Gavin's latest remains Jul 13. The five historical records use the supplied
timeline dates and text. Other theses start with one supplied version; owner
updates are explicit local demo actions.

## Validation

- `tests/mvp-thesis-detail.cjs`: visitor and owner states, pushed history,
  expansion/floating collapse, browser back/forward, sticky tabs, media
  clipping, shared actions, empty/loading states, old links, owner persistence
  and 320/360/393/430px layouts in Chromium and WebKit.
- `tests/mvp-thesis.cjs`: nine Feed cards, Sources/Alva access, profiles,
  bookmarks, search and responsive previews.
- Screenshot review excludes Figma's 59px status bar and 34px home indicator,
  since those are intentionally provided by the real mobile browser.
