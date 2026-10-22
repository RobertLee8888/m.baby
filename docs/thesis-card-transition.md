# Thesis card transition demo

Entry: `#/thesis-motion` in the prototype gallery, or `thesis-motion.html` on a phone.
The previous `#/mvp-social` demo remains available.

## Design sources

- [For You / V5 / Review updates, 5742:114415](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5742-114415)
- [A1 visitor detail, 7287:76564](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=7287-76564)

The first card is Satya Nadella, followed by the people recommendation and Gavin Baker. Traderstewie's card opens the exact supplied detail example. Other cards keep their own identity, ticker, text and chart when opened. Every detail includes the template's latest marker, continuous rail, endpoint and "View all 12 updates" control; the count is the supplied Figma fixture. The prototype covers these two pages. Existing navigation destinations, create, Ask Alva and the update-history destination remain outside this demo. Bookmark, follow, category filtering, the detail tabs and share are interactive.

Typography and theme values come from the existing `mvp.css` Library tokens. Avatars and charts reuse the original Figma image exports. Controls use existing Library SVGs. `assets/thesis/motion-lightbulb.svg` was extracted from the supplied list's SVG export; its original path is unchanged. No screen bitmap is used as UI.

## Motion

### Apple research and design decision

- [HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) calls for purposeful, brief feedback, predictable entry/exit directions and cancellation without waiting.
- [WWDC24: Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/) presents source-based zoom transitions: the selected cell becomes the destination, with continuous interaction and a stable return source. Its demonstration is slowed down, so its on-video timing is not a production duration specification.
- [WWDC18: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) emphasizes immediate response and interruption. The relevant design principle is continuity of the object and the user's intent, not adding a bounce to every element.

The previous implementation independently moved each avatar, label, ticker and chart. Its paragraph opacity handoff also passed through a blank state. The revised implementation treats the selected card as one surface, with identity, tickers, paragraph and images retained in normal layout. Additional detail content appears in the same expansion instead of starting a second entrance animation.

### Implementation

`thesis-card-transition.js` owns one reversible Web Animation of a registered CSS progress property. Both directions use 280 ms and `cubic-bezier(.2,.8,.2,1)`, a prototype tuning decision rather than a claimed Apple parameter. There is no initial shrink, pause, overshoot or stagger. The surface translates from the selected card's position while its clipping bounds expand. Its content inset and date-row space resolve within the same layout.

Paragraphs use two fixed line wraps inside one interpolated-height block. Their opacities are complementary, so the text never disappears; the width never changes frame by frame, avoiding repeated word wrapping and chart jumps. This short layout handoff happens near the end of the movement. Avatars, glyphs and charts retain their aspect ratios.

Back reverses toward the original card and preserves the feed and galleries' scroll positions. Returning from a scrolled detail keeps the current viewport rather than jumping to its top. A scroll during entry settles the transition immediately so reading is not blocked. Browser back/forward, interruption, keyboard entry/exit and reduced motion remain supported. Browsers without registered custom properties use an immediate transition.

## Layout and verification

The app uses fluid mobile layout, with a 360 px logical viewport scaled proportionally below 360 px. System status and home bars only appear in the desktop device preview. Real mobile browsers use their own safe-area insets. Horizontal charts and tickers clip at the screen edge.

`tests/thesis-motion.cjs` checks Figma coordinates, transition start/midpoint, cancellation and reversal, browser back/forward, preserved scroll/bookmark state, pinned tab panels, widths 320/360/393/430, reduced motion, direct detail links and Android preview insets. It saves screenshots for visual review. Configure `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `QA_ENGINE`, `QA_OUTPUT` and `DEMO_URL` as needed.
