# Thesis navigation motion demo

Entry: `#/thesis-motion` in the prototype gallery, or `thesis-motion.html` on a phone.
The previous `#/mvp-social` demo remains available.

## Design sources

- [For You / V5 / Review updates, 5742:114415](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5742-114415)
- [A1 visitor detail, 7287:76564](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=7287-76564)
- [Visitor profile, 5545:96427](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5545-96427)

The first card is Satya Nadella, followed by the people recommendation and Gavin Baker. Traderstewie's card opens the exact supplied detail example. Other cards keep their own identity, ticker, text and chart when opened. Every detail includes the template's latest marker, continuous rail, endpoint and "View all 12 updates" control; the count is the supplied Figma fixture. The prototype covers list, detail and visitor profile. Other main navigation destinations, create, Ask Alva and the update-history destination remain outside this demo. Bookmark, follow, category filtering, tabs and share are interactive.

Author avatars and names in the list, recommendation and detail open that author's profile. Profile cards open detail using the same card expansion. The supplied Maya profile is also directly inspectable at `thesis-motion.html#profile/maya`; its copy, counts and channels match the Figma example. Chamath reuses the adjacent visitor fixture. Other authors retain the known identity and thesis data without inventing follower counts or biographies. Active and Archived switch horizontally; the empty Archived panel reserves enough height to keep the tabs pinned.

Typography and theme values come from the existing `mvp.css` Library tokens. Avatars and charts reuse the original Figma image exports. Controls use existing Library SVGs. `assets/thesis/motion-lightbulb.svg` was extracted from the supplied list's SVG export; its original path is unchanged. No screen bitmap is used as UI.

## Motion

### Apple research and design decision

- [HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) calls for purposeful, brief feedback, predictable entry/exit directions and cancellation without waiting.
- [WWDC24: Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/) presents source-based zoom transitions: the selected cell becomes the destination, with continuous interaction and a stable return source. Its demonstration is slowed down, so its on-video timing is not a production duration specification.
- [WWDC18: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) emphasizes immediate response and interruption. The relevant design principle is continuity of the object and the user's intent, not adding a bounce to every element.
- [WWDC23: Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/) explains why preserving velocity when retargeting feels natural. This demo adopts that continuity principle with a bounded cubic timing curve, without introducing a spring engine or oscillation.
- [Material motion codelab](https://developer.android.com/codelabs/material-motion-android) demonstrates a bottom-entry container transform: incoming content stays inside the expanding surface. This informs how the profile and ticker pages reveal their contents on long journeys.

The previous implementation independently moved each avatar, label, ticker and chart. Its paragraph opacity handoff also passed through a blank state. The revised implementation treats the selected card as one surface, with identity, tickers, paragraph and images retained in normal layout. Additional detail content appears in the same expansion instead of starting a second entrance animation.

### Implementation

`thesis-motion-progress.js` owns timing and interruptible Web Animations for card, profile and ticker transitions. `thesis-card-transition.js` maps that single progress value to card geometry. Space and time are defined separately:

- **Spatial path:** The surface expands vertically from the clicked card. Shared content follows a shallow quadratic arc while moving from the list's 16 px inset to the detail's 48 px inset. For progress `p`, the horizontal fraction is `p + bend * p * (1 - p)`; vertical movement uses `p`. The control point moves toward the destination column, so the final approach is vertical. Maximum lateral deviation from the straight diagonal is 8 px, reduced for short vertical distances. Identity, tickers, text and charts use the same path. The full-screen surface does not sway sideways.
- **Timing:** Nearby cards use Alva's 240 ms large-element budget; identity travel over 160 px uses its 280 ms major-transform budget. Both directions use the project's `cubic-bezier(.4,0,.2,1)`. Long journeys advance their spatial progress with `p = q + a * q * (1 - q)`, where `q` is the eased phase and `a` increases from 0 at 160 px to 0.8 at 560 px. This preserves acceleration and a zero-velocity arrival while bringing low entries close to their destination earlier. Geometry, clipping, type blending and content opacity all use the same `p`; there is no separate body entrance. There is no hold, anticipatory shrink, stagger or bounce. These are prototype choices, not claimed Apple constants.
- **Return:** The same geometric path is traversed back to the source card. If interrupted, the controller samples the current value and velocity, then matches that tangent on a replacement cubic curve. The card briefly brakes before turning rather than instantly reversing velocity. The first control point is bounded to prevent leaving the list/detail endpoints. Remaining journeys use the existing 120/200 ms budgets when short, otherwise the full duration. A completed arrival has zero velocity.

Paragraphs use two fixed line wraps inside one interpolated-height block. Their opacities are complementary, so the text never disappears; the width never changes frame by frame, avoiding repeated word wrapping and chart jumps. This short layout handoff happens near the end of the movement. Avatars, glyphs and charts retain their aspect ratios.

Back reverses toward the original card and preserves the feed and galleries' scroll positions. Returning from a scrolled detail keeps the current viewport rather than jumping to its top. A scroll during entry settles the transition immediately so reading is not blocked. Browser back/forward, interruption, keyboard entry/exit and reduced motion remain supported. Browsers without registered custom properties use an immediate transition.

### Underlying page depth

The same Web Animation drives an inherited progress value on the app, shared by the foreground and its immediate underlay. Every page surface fills the entire screen, including the top and bottom safe areas. Safe-area insets position the internal headers, scrollports and bottom controls; they do not reduce the page surface. The underlay recedes around its center with scale `1000 / (1000 + 40 * p)`, the exact projection of 40 px Z travel under a 1000 px perspective, reaching about 96.15% of its original visual size. Using that 2D projection keeps the browser's rounded clip applied to the entire background as well as its contents. The Library's black scrim covers the entire underlay at opacity `p`, including its simulated status and home bars. Both foreground and underlay use the selected preview device's screen radius (54 px for iPhones; 26/36/38 px for the Android fixtures). A real mobile browser uses a 32 px fallback because it cannot report the physical display radius. The underlay retains that radius throughout recession, revealing a black backdrop. There is no extra delay, tilt, bounce or separate animation clock.

The foreground expands to all four screen edges. Its visible clip interpolates from the source radius to the same page radius on the shared progress value, and reverses along that path on return. The same rounded clip owns both the resting and moving page, avoiding double clipping or a corner snap at the handoff. Preview status and home bars belong to their page, with the incoming glyphs appearing during the final 15% of expansion so they do not overlap the moving identity. Only the physical camera cutout stays fixed. Real mobile browsers do not display simulated system chrome. Card identity padding interpolates the top safe area along with its existing geometry, preserving both source and destination alignment.

A covered page holds its recessed state until the page above it closes. In nested navigation, older covered pages stay still while only the immediate underlay moves. Return measurements temporarily restore the source's untransformed geometry within the same task, then traverse the same forward path in reverse. Completion restores the active page's full size, brightness and corner shape without touching its scroll state. Reduced motion skips both foreground and depth movement.

### Profile and ticker continuity

`thesis-profile-transition.js` moves the avatar/name as one identity group to the profile's 56 px portrait. `thesis-ticker-transition.js` retains the company logo and symbol while introducing the company name and exchange. A shallow inward arc, capped at 8 px, connects source and destination. The same 240/280 ms timing and velocity-preserving retargeting apply in both directions.

Each destination is one opaque container. Its initial clip is the visible part of the source identity or ticker chip, respecting both vertical and horizontal scrollports. The container translates with the identity and expands its clip to the page bounds. Body content fades in inside that moving container, so it cannot arrive in a stationary destination while the selected identity is still crossing the screen. Profile text blends the static Delight endpoint faces at the same interpolated size and glyph width. There are no staggered bio, tab or card entrances.

Scrolling during entry settles the page immediately. Once the profile identity scrolls fully behind its header, the compact identity appears upward in the same header alignment used by detail. Returning from that state starts from the visible compact avatar, not the offscreen hero. A partly obscured hero retains its top clipping at the start of the return, so it cannot flash over the header. `thesis-motion-navigation.js` retains each underlying screen, including profile tab state and horizontal chart offsets, and reconciles browser history with the same reversible transitions.

## Layout and verification

The app uses fluid mobile layout, with a 360 px logical viewport scaled proportionally below 360 px. System status and home bars only appear in the desktop device preview. Real mobile browsers use their own safe-area insets. Horizontal charts and tickers clip at the screen edge.

For You's 50 px title area collapses with the first 50 px of scroll, leaving the 44 px topic row pinned. The title fades in place; only its containing space closes. The header's sole divider stays on the bottom edge of the topics. A fixed scrollport and initial content padding keep content movement one-to-one with scrolling, without resizing the viewport on each frame. Short filtered lists reserve enough height to close the title fully. Returning from detail, profile or ticker preserves the feed's scroll and header state; choosing a topic or returning to the top restores the expanded state.

`tests/thesis-motion.cjs` checks Figma coordinates, curved trajectories, acceleration/settling, velocity continuity on reversal, endpoint bounds, browser back/forward, preserved scroll/bookmark state, pinned tab panels, widths 320/360/393/430, reduced motion, direct detail links and Android preview insets. It saves screenshots for visual review. Configure `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `QA_ENGINE`, `QA_OUTPUT` and `DEMO_URL` as needed.

`tests/thesis-profile-motion.cjs` adds profile coordinates, image resolution, shared identity endpoints and curve, non-overlapping body content, entry reversal, nested detail/profile history, compact-header return, stable empty panels, profile/detail deep links, the same four widths, reduced motion and Android insets. Both suites run in Chromium and WebKit. The exported 2x Figma profile is compared to a 393x759 viewport after excluding its 59 px system status bar and 34 px home bar.

`tests/thesis-container-motion.cjs` exercises low profile, ticker and card entries at widths 320/393/430. It checks that body content never overtakes the identity, the identity is within 60 px of arrival at half time, and foreground/depth use one driver without jumps when reversed. It also covers centered, monotonic underlay recession, nested depth stability, full restoration, reduced motion, preserved scroll, and pixel-identical header occlusion when a partly obscured profile hero returns. It saves intermediate frames for Chromium and WebKit visual review.

`tests/thesis-scroll.cjs` checks reversible header collapse at 320/360/393/430 px, stationary title glyphs, a single bottom divider, one-to-one content displacement, short filters, navigation restoration, independent horizontal scrolling, reduced motion and Android preview insets. It captures expanded, intermediate and collapsed states in Chromium and WebKit.

`tests/thesis-fullscreen-motion.cjs` checks all six gallery devices across detail, profile and ticker entry/return. It verifies full-screen surface bounds, safe control positions, shared identity endpoints, black backdrop pixels, equal scrim coverage in the top and bottom safe areas, device-specific page radii, four visibly rounded foreground corners, and restoration to the original full screen. Intermediate and completed screenshots are saved for visual review in Chromium and WebKit.
