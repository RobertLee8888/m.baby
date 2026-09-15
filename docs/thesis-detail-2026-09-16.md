# Thesis Detail, September 16

References: [detail 6908:68814](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7?node-id=6908-68814),
[All updates 6720:91916](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7?node-id=6720-91916).

## Implementation

- The author identity and shared Follow control occupy the 56px topbar. The
  content does not repeat that identity or the list's lifecycle badge.
- Version capsules are 28px tall, with the independent 28px down-arrow, right
  fade and chronological connector. The latest version carries a blue badge.
  View latest appears only after the latest capsule scrolls completely out of
  view. It selects the latest version and resets horizontal scroll.
- The All updates sheet uses the shared modal, dialog surface, 12px top corners,
  56px header, 24px timeline spacing, 12px rail and the original 8px SVG nodes.
  The sheet begins 47px below the product viewport's safe top. Close, scrim,
  Escape, drag, browser back and forward preserve the detail context.
- Choosing a version replaces its body, source links, charts, tickers, Signals
  and Related theses together. Bookmark identity remains the underlying thesis;
  shared links and Ask Alva use the selected version.
- Signals use the supplied gray source boxes, role subtitles, inline source
  links and the original Alva identity SVG. Each evidence row has a bottom rule.
- The fixed 48px footer contains Ask Alva, bookmark count and Share. The app tab
  bar remains hidden in detail. Native mobile has no simulated system bars.

`mvp-thesis-detail.js` owns the detail layout; `mvp-thesis-version-nav.js` owns
the version control and sheet; `mvp-thesis-versions.js` owns supplied historical
records. Cards, identities, Follow, bookmark state, Sources, tickers and modals
reuse the existing components. Page reset disposes navigation observers and
listeners.

## Content Boundaries

The new layout is applied to each existing thesis, retaining its author, dates,
body and original chart bitmaps. The reference's Traderstewie label, Gavin avatar
and AMD label on a GOOGL chart are not substituted into unrelated feed entries.

Gavin's latest remains Jul 13. Its five historical summaries and dates come from
the supplied timeline. Jul 10's three full paragraphs come from 5689:96154;
its Signals appear in the existing historical reference 6605:30792. Other
historical records display the text and source supplied for that version; they
do not inherit current charts, Signals or related cards where none were supplied.
Other theses currently have one supplied version. This is local demo data.

## Validation

- `tests/mvp-thesis-detail.cjs`: version content ownership, return-to-latest
  condition, six dismiss/navigation paths, shared bookmark state, version
  links, Sources/Alva access and 320/360/393/430px layouts, Chromium and WebKit.
- `tests/mvp-thesis.cjs`: all nine cards, search, profiles, Me, bookmarks,
  related navigation and responsive previews.
- `tests/mvp-social-device.cjs`: six device presets, safe areas, native system
  bar omission and twenty repeated detail visits.
- Figma screenshot comparison used the same sample text temporarily in a QA
  browser to isolate layout from content differences. At 393px native width,
  the body starts at y100, source y370, chart y402, tickers y549 and tabs y589,
  matching the reference after excluding its status bar. Original chart data
  and zero letter spacing remain consistent with the existing demo.
