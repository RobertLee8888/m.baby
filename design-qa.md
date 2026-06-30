# m.baby Design QA

final result: passed

Viewport: 393 x 852 mobile. Sidebar full-page reference: 393 x 1313.

Source references were exported from the requested Figma nodes and compared against local Chrome Headless captures from `http://127.0.0.1:5173/`.

Product Design follow-up pass: passed. A non-visual `sr-only` semantic layer was added after the first QA pass so screen readers can identify each screen, key content, and available actions while preserving exact visual parity.

Detail tab update pass: passed. The Playbook Detail content area now uses the four direct exports from Figma node `9949:133034`, with the original top chrome and fixed bottom action/Safari shell preserved. PNG comparison evidence is in `.qa/detail-tabs-chrome-png/`, expected compositions are in `.qa/detail-tabs-expected/`, and DOM geometry evidence is in `.qa/detail-tabs-browser/detail-geometry.json`.

## Flow Coverage

- Login: any tap completes login and enters Chat.
- Chat: menu button opens Sidebar.
- Sidebar: avatar opens Profile.
- Sidebar: Explore opens Explore.
- Sidebar: Playbooks view all opens Playbooks.
- Sidebar: Chats view all opens Recent Chats.
- Sidebar and Recent Chats chat rows open selected Chat.
- Sidebar, Playbooks, and Explore playbook rows open Playbook Detail.
- Playbook Detail tabs switch between Overview, Analytics, Strategy, and Feed.
- Playbook Detail Ask Alva opens the chat overlay.
- Playbook Detail info opens the information modal.
- Overlay and modal close back to Playbook Detail.
- Non-mobile viewport displays only `此 demo 仅在移动端窗口尺寸生效`.

## Pixel Comparison

| Screen | Figma Size | App Size | Changed Pixels |
| --- | --- | --- | --- |
| Login | 393 x 852 | 393 x 852 | 0 |
| Chat | 393 x 852 | 393 x 852 | 0 |
| Sidebar | 393 x 1313 | 393 x 1313 | 0 |
| Playbooks | 393 x 852 | 393 x 852 | 0 |
| Recent Chats | 393 x 852 | 393 x 852 | 0 |
| Explore | 393 x 852 | 393 x 852 | 0 |
| Playbook Detail - Overview | 393 x 852 viewport, 393 x 2218 tab content | 393 x 852 | 0 |
| Playbook Detail - Analytics | 393 x 852 viewport, 393 x 1644 tab content | 393 x 852 | 0 |
| Playbook Detail - Strategy | 393 x 852 viewport, 393 x 1112 tab content | 393 x 852 | 0 |
| Playbook Detail - Feed | 393 x 852 viewport, 393 x 1956 tab content | 393 x 852 | 0 |
| Ask Alva Overlay | 393 x 852 | 393 x 852 | 0 |
| Info Modal | 393 x 852 | 393 x 852 | 0 |
| Profile | 393 x 852 | 393 x 852 | 0 |
| Selected Chat | 393 x 852 | 393 x 852 | 0 |

## Notes

- The visible UI uses Figma-exported state images as the visual baseline for pixel parity.
- Interaction is implemented with scaled hotspots and React state transitions.
- Page changes, overlay entry, and modal entry use short eased animations.
- Rechecked after the semantic accessibility patch: every listed state still has 0 changed pixels against the Figma source.
- Rechecked after the detail-tab patch: all four Playbook Detail tab viewports have 0 changed pixels against their composed Figma source at 393 x 852.
