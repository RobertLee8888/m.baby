# Social Feed acceptance

Reference: [Feed-Mobile-MVP 5031:94702](https://www.figma.com/design/EHag6olZJxmlkf1hbAzSi7/Feed-Mobile-MVP?node-id=5031-94702).
Route: `#/mvp-social`; standalone: `mvp.html?feed=social`.

## Structure and assets

- The 11 posts and their ordering come from children 5031:94723 through 5031:94733.
- At 393px the measured heights are 527, 402, 426, 611.0625, 608, 543, 505, 374, 521, 488 and 386px, matching all 11 frames.
- Source identities use 32px root avatars, 24px nested avatars, 14/22 names and 12/20 roles with the designed -4px name/role spacing.
- Nested quotations retain reading rails. Analysis uses `content/br03`, 12px padding/gap and an 8px radius; ticker labels are 28px high; CTAs are 32px high; social rows are 36px high.
- Original SVG exports are used for the Alva mark, social icons, notification, event types and stance arrow. Reuters uses the full-resolution bitmap from this frame. The other identities and media reuse existing Figma exports. Downloaded chart/video duplicates were byte-compared before reuse.
- Monochrome SVG mask opacity is normalized so the semantic CSS color is applied once, without multiplying Figma's exported text opacity a second time. The chat CTA is exported from its actual instance; the design-context asset incorrectly contained its placeholder glyph.
- Theme colors come from the existing MVP semantic variables. Native mobile has no simulated OS bars. The existing 360px minimum logical width and proportional scaling below 360px are preserved.

## Interaction boundaries

- Filter counts derive from the actual 11 posts, not the inconsistent example counts in the static filter strip. Only followed tickers with recent content appear. The initial counts are GOOG 1, NVDA 3, MSFT 4 and AMZN 1. The Following page, temporary filters and follow controls stay shared with MVP.
- Refresh completes at the end of loading, without fabricated new posts or a completion message.
- Likes, reposts, tracking and the current user's replies are local demo state. Existing sample engagement counts do not claim a fetched conversation history. Reply opens a composer, not fabricated comments by real people.
- Alva CTAs show a local thinking/reply simulation using the approved analysis and source statements. They do not call a model or produce portfolio-specific advice.
- Sharing carries the selected post ID; native sharing falls back to copying or displaying the link. Cancelling native share does not show an error.
- Closing a sheet restores feed context. Timers are cancelled on teardown. The reply composer uses 16px input text and visual-viewport keyboard avoidance.

## Verification

`tests/mvp-social.cjs` covers all 11 card heights, source destinations, nested references, source-link underlines, filter/count consistency, toggles and persistence, safe reply rendering, blank input, thinking teardown, share/deep links, refresh, keyboard-viewport avoidance, 320/360/393/430px layouts, dark mode and the desktop shell.

Screenshots and side-by-side inspections were made for every post against the reference. Existing MVP card/navigation and refresh tests are run separately to protect the original route.

These are not pixel-identical typography claims: the web implementation uses zero tracking and natural inline text flow, while Figma's supplied styles use 1% tracking and separate first-line text layers. Some word-break positions and text-button widths differ, although the 11 complete card heights match. New reply/conversation states have no supplied frames and reuse the existing modal/token system. Actual iOS keyboard behavior still requires a physical-device pass; automated viewport simulation is not a substitute for one.
