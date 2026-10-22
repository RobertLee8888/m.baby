# Thesis card transition demo

Entry: `#/thesis-motion` in the prototype gallery, or `thesis-motion.html` on a phone.
The previous `#/mvp-social` demo remains available.

## Design sources

- [For You / V5 / Review updates, 5742:114415](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5742-114415)
- [A1 visitor detail, 7287:76564](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=7287-76564)

The first card is Satya Nadella, followed by the people recommendation and Gavin Baker. Traderstewie's card opens the exact supplied detail example. Other cards keep their own identity, ticker, text and chart when opened. The prototype covers these two pages. Existing navigation destinations, create, Ask Alva and update history are not implemented in this demo. Bookmark, follow, category filtering, the detail tabs and share are interactive.

Typography and theme values come from the existing `mvp.css` Library tokens. Avatars and charts reuse the original Figma image exports. Controls use existing Library SVGs. `assets/thesis/motion-lightbulb.svg` was extracted from the supplied list's SVG export; its original path is unchanged. No screen bitmap is used as UI.

## Motion

`thesis-card-transition.js` owns the reversible transition. Both directions last 280 ms with `cubic-bezier(.4,0,.2,1)`. The surface opens from the selected card's visible bounds. Avatar, name, role, ticker and chart move between their measured positions. The lower content enters by 24 px while the surface expands.

Paragraph widths differ between the list and the timeline. Their two real DOM layouts translate together, with a brief opacity handoff so lines neither intersect nor stretch. The transition is interruptible: reversing changes the playback direction at its current position. Back restores the original list and horizontal gallery positions. Native browser history, deep links, keyboard entry/exit and reduced motion are supported.

The continuity approach follows [Apple's source-based navigation transitions](https://developer.apple.com/documentation/uikit/enhancing-your-app-with-fluid-transitions) and [Material container transforms](https://codelabs.developers.google.com/codelabs/material-motion-android/), using the project's motion timing.

## Layout and verification

The app uses fluid mobile layout, with a 360 px logical viewport scaled proportionally below 360 px. System status and home bars only appear in the desktop device preview. Real mobile browsers use their own safe-area insets. Horizontal charts and tickers clip at the screen edge.

`tests/thesis-motion.cjs` checks Figma coordinates, transition start/midpoint, cancellation and reversal, browser back/forward, preserved scroll/bookmark state, pinned tab panels, widths 320/360/393/430, reduced motion, direct detail links and Android preview insets. It saves screenshots for visual review. Configure `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `QA_ENGINE`, `QA_OUTPUT` and `DEMO_URL` as needed.
