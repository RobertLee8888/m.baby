# Thesis navigation motion demo

Entry: `#/thesis-motion` in the prototype gallery, or `thesis-motion.html` on a phone.
The previous `#/mvp-social` demo remains available.

## Design sources

- [For You / V5 / Review updates, 5742:114415](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5742-114415)
- [A1 visitor detail, 7287:76564](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=7287-76564)
- [Visitor profile, 5545:96427](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5545-96427)

The list contains 11 theses verified against the supplied [mobile reference](https://alva.ai/u/harryzz/playbooks/baba-thesis-feed) on 2026-10-22, starting with Tom Lee, then the people recommendation and Raoul Pal. Authors, roles, dates, thesis text, original sources and version counts come from that reference. List, detail, author profiles and ticker pages share the same records. The Figma card structure, Library controls and motion remain in place; the existing ticker-matched chart bitmaps remain static demo illustrations, not live market data. Bookmark totals are omitted because the reference does not supply them.

Details retain the latest marker, continuous rail, endpoint and update entry, with the actual version count instead of a fixed 12. Latest Signals use representative approved examples from the reference; empty states preserve its monitoring status. Latest related theses are drawn from the local sample by shared ticker. This is an 11-thesis content snapshot, not a mirror of the reference's entire database or a monitoring service. Other main navigation destinations, create and Ask Alva remain outside this demo. Bookmark, follow, category filtering, tabs, share and version history are interactive.

### Historical versions

`View all updates` opens a descending timeline, using the existing Figma timeline layout, Library tokens and controls. The reference's Timeline panels were read on 2026-10-22: the 11 theses contain 29 versions, including 18 historical versions. `thesis-motion-versions.js` stores those historical dates, original version text and source links. Latest content remains the reference's current thesis summary; older content is the text supplied for that specific version, without invented elaboration.

Each historical row opens its own detail, marked `History`, with `View latest` beside its date. Version-specific text and sources change together. The reference does not expose historical chart, signal or related-thesis records, so those versions have no chart and use empty context panels rather than inheriting current data. Ticker identity and the existing ETF-proxy explanation remain thesis metadata. All updates omits the repeated proxy explanation; it remains in full detail. A thesis with one recorded version shows one row and no fabricated earlier version.

Both old and current details can open All updates. The selected version is marked `Viewing`; selecting a version already underneath returns to that instance. In particular, the latest timeline row returns to the existing latest detail. Back preserves both the timeline and the prior detail's scroll positions. Explicit `View latest` returns to the same thesis's latest detail at its beginning. Profile/ticker navigation returns to the historical version it left. Bookmark and Follow belong to the thesis/author, while Share preserves the selected version in the URL: `thesis-motion.html#tom-lee-spy/version/2026-08-07`. Direct loading and refreshing the URL retain that version, with usable parent navigation.

History navigation moves a complete page horizontally using `thesis-page-transition.js`, with the shared 340 ms decelerating clock and underlying-page depth. Back reverses that movement; interruption preserves velocity and reduced motion skips it. Feed cards continue using the existing card expansion.

Author avatars and names in the list, recommendation and detail open that author's profile. Profile cards open detail using the same card expansion. All six authors retain the Figma visitor structure: identity, follower row, expandable biography, external account, public-information note and Active / Archived tabs. Profile metadata lives separately in `thesis-motion-profile-data.js` so replacing feed records cannot silently remove it. Posts are filtered by author; no other author's theses are relabeled to fill the profile. The empty Archived panel reserves enough height to keep the tabs pinned.

Chamath's role, biography and 12.8K follower fixture reuse the existing Figma implementation. Other authors start with zero demo followers, matching the reference's local follow model; follow/unfollow updates every open instance of the profile. These are demo counts, not live social-network totals. New biographies are concise paraphrases of the authors' own published information, checked on 2026-10-22:

- [Tom Lee: Fundstrat team](https://fundstrat.com/firm/our-team/); [X account](https://x.com/fundstrat/status/2039056970049585551).
- [Raoul Pal: Real Vision biography, p. 8](https://media.realvision.com/wp/20250725164452/RV_5Years-Survival-RP.pdf).
- [Jim Rogers: author website](https://www.jimrogers.com/contact-morejim/).
- [Cathie Wood: ARK team](https://www.ark-invest.com/our-team?show_author=2048).
- [Gavin Baker: personal profile](https://about.me/gavinbaker).

The other X handles are retained from the supplied thesis-reference authors. No join dates, following counts or extra theses are invented. This restoration uses the checked-in Figma profile implementation and comparison export; the live Figma connector was unavailable during this pass.

Typography and theme values come from the existing `mvp.css` Library tokens. Avatars and charts reuse the original Figma image exports. Controls use existing Library SVGs. `assets/thesis/motion-lightbulb.svg` was extracted from the supplied list's SVG export; its original path is unchanged. No screen bitmap is used as UI.

## Motion

### Motion references and design decision

- [HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) calls for purposeful, brief feedback, predictable entry/exit directions and cancellation without waiting.
- [WWDC24: Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/) presents source-based zoom transitions: the selected cell becomes the destination, with continuous interaction and a stable return source. Its demonstration is slowed down, so its on-video timing is not a production duration specification.
- [WWDC18: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) emphasizes immediate response and interruption. The relevant design principle is continuity of the object and the user's intent, not adding a bounce to every element.
- [WWDC23: Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/) explains why preserving velocity when retargeting feels natural. This demo adopts that continuity principle with a bounded cubic timing curve, without introducing a spring engine or oscillation.
- [Material motion codelab](https://developer.android.com/codelabs/material-motion-android) demonstrates a bottom-entry container transform: incoming content stays inside the expanding surface. This informs how the profile and ticker pages reveal their contents on long journeys.
- [Airbnb: Motion engineering at scale](https://medium.com/airbnb-engineering/motion-engineering-at-scale-5ffabfc878) describes coordinated shared-element transitions, anchored content and background blur. The current revision follows that continuity approach with a decelerating expansion. The timing below is tuned for this demo, not an extracted Airbnb specification.

The previous implementation independently moved each avatar, label, ticker and chart. Its paragraph opacity handoff also passed through a blank state. The revised implementation treats the selected card as one surface, with identity, tickers, paragraph and images retained in normal layout. Additional detail content appears in the same expansion instead of starting a second entrance animation.

### Implementation

`thesis-motion-progress.js` owns timing and interruptible Web Animations for card, profile and ticker transitions. `thesis-card-transition.js` maps that single progress value to card geometry. Space and time are defined separately:

- **Spatial path:** The surface expands from the clicked entry with width and height interpolating on the same progress. Shared content follows a shallow quadratic arc while moving from the list's 16 px inset to the detail's 48 px inset. For progress `p`, the horizontal fraction is `p + bend * p * (1 - p)`; vertical movement uses `p`. The control point moves toward the destination column, so the final approach is vertical. Maximum lateral deviation from the straight diagonal is 8 px, reduced for short vertical distances. Identity, tickers, text and charts use the same path. The full-screen surface does not sway sideways.
- **Timing:** Nearby entries take 340 ms; identity travel over 160 px takes 380 ms, reduced from 400/440 ms at Robert's request. Both directions use `cubic-bezier(.22,.75,.3,1)`: immediate movement, progressively less distance per frame, and zero velocity at arrival. There is no additional distance-based acceleration mapping. At half time the identity has covered roughly 92% of its path; the remaining distance settles over the second half. Geometry, clipping, type blending and content opacity all use the same eased progress. There is no hold, anticipatory shrink, stagger or bounce. The existing decelerating tail is preserved.
- **Return:** The same geometric path is traversed back to the source card. If interrupted, the controller samples the current value and velocity, then matches that tangent on a replacement cubic curve. The card briefly brakes before turning rather than instantly reversing velocity. The first control point is bounded to prevent leaving the list/detail endpoints. Short remaining journeys take 140/220 ms, otherwise the full duration. A completed arrival has zero velocity.

Paragraphs use two fixed line wraps inside one interpolated-height block. Their opacities are complementary, so the text never disappears; the width never changes frame by frame, avoiding repeated word wrapping and chart jumps. This short layout handoff happens near the end of the movement. Avatars, glyphs and charts retain their aspect ratios.

Back reverses toward the original card and preserves the feed and galleries' scroll positions. Returning from a scrolled detail keeps the current viewport rather than jumping to its top. A scroll during entry settles the transition immediately so reading is not blocked. Browser back/forward, interruption, keyboard entry/exit and reduced motion remain supported. Browsers without registered custom properties use an immediate transition.

### Underlying page depth

The same Web Animation drives an inherited progress value on the app, shared by the foreground and its immediate underlay. Every page background remains rectangular, stationary and edge-to-edge, including its top and bottom safe areas. A single `.motion-page-content` wrapper contains the header, scrollport, bottom controls and simulated system bars. Only that wrapper recedes around its center with scale `1000 / (1000 + 40 * p)`, reaching about 96.15% of its original size. A subtle `1.5 * p` px blur increases with depth. The Library's black scrim covers the entire stationary background at opacity `p`, so there are no exposed gaps around the content. The physical screen radius is not used for page geometry. There is no extra delay, tilt, bounce or separate animation clock.

The foreground expands to all four screen edges. Each initial side inset is at least 12 px, then every inset reduces by the same `1 - p` multiplier. The minimum is applied to the initial geometry, not clamped during movement. Width and height therefore grow continuously with equal normalized progress from the first frame, without a held width or a second expansion phase. Corner radius follows the continuous curve `32 * (1 - p^4)` px: large corners remain legible during the main expansion and smoothly reach zero at full screen, independently of the width. The resting surface has no corner clip, matching the last frame without a handoff snap. This works in rectangular browser viewports and rounded physical device frames. Preview status and home bars belong to their page, with incoming glyphs appearing during the final 15% of expansion. Only the physical camera cutout stays fixed. Real mobile browsers do not display simulated system chrome. Card identity padding interpolates the top safe area along with its existing geometry, preserving source and destination alignment.

A covered page holds its recessed state until the page above it closes. In nested navigation, older covered pages stay still while only the immediate underlay moves. Return measurements temporarily restore the source's untransformed geometry within the same task, then traverse the same forward path in reverse. Completion restores the active page's full size, brightness and corner shape without touching its scroll state. Reduced motion skips both foreground and depth movement.

### Profile and ticker continuity

`thesis-profile-transition.js` moves the avatar/name as one identity group to the profile's 56 px portrait. `thesis-ticker-transition.js` retains the company logo and symbol while introducing the company name and exchange. A shallow inward arc, capped at 8 px, connects source and destination. The shared 340/380 ms timing and velocity-preserving retargeting apply in both directions.

Each destination is one opaque container. Its initial clip is the visible part of the source identity or ticker chip, respecting both vertical and horizontal scrollports. The container translates with the identity and expands its clip to the page bounds. Body content fades in inside that moving container, so it cannot arrive in a stationary destination while the selected identity is still crossing the screen. Profile text blends the static Delight endpoint faces at the same interpolated size and glyph width. There are no staggered bio, tab or card entrances.

The ticker exchange subtitle retains its full text width throughout movement. The source trend fades out over the first 30% of spatial progress, then the complete exchange text fades in over the next 30%, without clipping individual letters or overlapping the outgoing trend.

Scrolling during entry settles the page immediately. Once the profile identity scrolls fully behind its header, the compact identity appears upward in the same header alignment used by detail. Returning from that state starts from the visible compact avatar, not the offscreen hero. A partly obscured hero retains its top clipping at the start of the return, so it cannot flash over the header. `thesis-motion-navigation.js` retains each underlying screen, including profile tab state and horizontal chart offsets, and reconciles browser history with the same reversible transitions.

## Layout and verification

The app uses fluid mobile layout, with a 360 px logical viewport scaled proportionally below 360 px. System status and home bars only appear in the desktop device preview. Real mobile browsers use their own safe-area insets. Horizontal charts and tickers clip at the screen edge.

For You's 50 px title area collapses with the first 50 px of scroll, leaving the 44 px topic row pinned. The title fades in place; only its containing space closes. The header's sole divider stays on the bottom edge of the topics. A fixed scrollport and initial content padding keep content movement one-to-one with scrolling, without resizing the viewport on each frame. Short filtered lists reserve enough height to close the title fully. Returning from detail, profile or ticker preserves the feed's scroll and header state; choosing a topic or returning to the top restores the expanded state.

`tests/thesis-motion.cjs` checks Figma coordinates, curved trajectories, progressively decreasing travel per time interval, velocity continuity on reversal, endpoint bounds, browser back/forward, preserved scroll/bookmark state, pinned tab panels, widths 320/360/393/430, reduced motion, direct detail links and Android preview insets. It saves screenshots for visual review. Configure `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `QA_ENGINE`, `QA_OUTPUT` and `DEMO_URL` as needed.

`tests/thesis-profile-motion.cjs` adds profile coordinates, image resolution, shared identity endpoints and curve, non-overlapping body content, entry reversal, nested detail/profile history, compact-header return, stable empty panels, profile/detail deep links, the same four widths, reduced motion and Android insets. Both suites run in Chromium and WebKit. The exported 2x Figma profile is compared to a 393x759 viewport after excluding its 59 px system status bar and 34 px home bar.

`tests/thesis-container-motion.cjs` exercises low profile, ticker and card entries at widths 320/393/430. It checks that body content never overtakes the identity, the identity is within 60 px of arrival at half time, and foreground/depth use one driver without jumps when reversed. It also covers centered, monotonic underlay recession, nested depth stability, full restoration, reduced motion, preserved scroll, and pixel-identical header occlusion when a partly obscured profile hero returns. It saves intermediate frames for Chromium and WebKit visual review.

`tests/thesis-scroll.cjs` checks reversible header collapse at 320/360/393/430 px, stationary title glyphs, a single bottom divider, one-to-one content displacement, short filters, navigation restoration, independent horizontal scrolling, reduced motion and Android preview insets. It captures expanded, intermediate and collapsed states in Chromium and WebKit.

`tests/thesis-fullscreen-motion.cjs` checks all six gallery devices and an unframed rectangular viewport across detail, profile and ticker entry/return. It verifies equal normalized width/height progress at seven intermediate times, continuous growth from the first frames, visible corners during the main expansion, square endpoints, stationary backgrounds, content recession/blur, safe controls, shared identity endpoints and scrim pixels. Intermediate and completed screenshots are saved for visual review in Chromium and WebKit. The ticker suite also checks that the subtitle has full glyph width throughout the transition, fits within the page clip while visible and does not overlap the outgoing trend.

`tests/thesis-history.cjs` visits all 18 historical details, verifies the 29-version totals and original source links, checks that current charts/signals/related data never leak into old versions, and covers timeline selection, exact scroll restoration, deep links/reload, version-specific sharing, shared bookmark state, nested ticker navigation, interrupted page motion, latest return, reduced motion and empty-tab pinning at 320/360/393/430 px. It saves timeline, historical-detail and intermediate-motion screenshots.
