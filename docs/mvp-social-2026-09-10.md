# Social feed, thesis detail and profiles

References:

- [Feed and detail section 5506:89524](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5506-89524).
- [Profile section 5482:88375](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5482-88375).

Route: `#/mvp-social`. Original MVP and splash are unchanged.

## Implementation

- All 11 feed cards use the new publication-time identity, inline Alva analysis, dotted source link, combined ticker/action row, and bookmark action. The Alva logo, KOL stance icons, profile avatars and channel icons come from original Figma exports. Source media remains real bitmap content, not a screenshot of the UI.
- The complete P01 article, Signals, Related theses and Updates follow frames 5396:87894, 5595:91099 and 5595:91189. The earlier versions are the explicitly labelled demo examples supplied in Figma. Other posts reuse the detail layout with their own source text and media.
- Details keep their action bar above the shared bottom navigation. Switching a pinned tab starts at its first item. Returning to a previous page preserves scroll position and selected tabs.
- Avatar/name controls open the matching identity. The owner has Thesis, Followed and Bookmark modes. The supplied member and external-person profile variants are implemented; other authors use their actual existing identity without inventing biographies. External bio expansion displays the supplied full biography in the shared sheet because no longer biography was provided.
- Likes, bookmarks, tracking and replies share state across feed, detail and profile. Bookmarks include related and earlier-version cards and persist across reload. Unfollow updates the common feed and market data. Share links resolve to the selected thesis or profile.
- `mvp-social-pages.js` owns page rendering and navigation. `mvp-social-detail-data.js` owns the supplied article/profile examples. Feed rendering, persisted social state and the existing reply/chat sheets stay in `mvp-social.js`; no new router or component framework was introduced.

## Verification

- `tests/mvp-social.cjs`: all 11 card heights match their Figma frame heights at 393px: 535, 326, 356, 535.0625, 500, 467, 429, 298, 445, 428 and 342px. Includes filters, media, nested quotes, comments, persistence, thinking teardown, sharing, refresh and keyboard avoidance.
- `tests/mvp-social-pages.cjs`: Chromium and WebKit; 320/360/393/430px; article expansion, tab anchoring and first-item visibility, avatar navigation, history back/forward, scroll restoration, shared state, profile filters, unfollow, deep links and dark mode. All loaded images are checked for successful decoding; no browser errors or missing resources were observed.
- `tests/mvp-social-device.cjs`: detail/profile in all six device presets, native-mode OS-bar removal and repeated navigation followed by opening the chat composer.
- Original MVP regression: `tests/mvp-audit.cjs` and the eight feed-model/update unit tests pass.
- Screenshots were compared with Figma for feed cards, detail and profile variants. Native screenshots omit Figma's 59px system-status and 34px home-indicator illustration areas, as required.

## Boundaries

These are not pixel-identical typography claims: Figma uses 1% tracking and some manually separated first-line text; the web implementation preserves zero tracking and responsive inline flow. Small word-break and text-button-width differences remain. No new real-time financial data or AI service is connected; the interaction states remain a local demo. Automated WebKit and keyboard-viewport tests do not replace an on-device Safari keyboard pass.
