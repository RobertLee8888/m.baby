# m.baby Design QA

final result: passed

Viewport: 393 x 852 mobile. Sidebar full-page reference: 393 x 1313.

Source references were exported from the requested Figma nodes and compared against local Chrome Headless captures from `http://127.0.0.1:5173/`.

## Flow Coverage

- Login: any tap completes login and enters Chat.
- Chat: menu button opens Sidebar.
- Sidebar: avatar opens Profile.
- Sidebar: Explore opens Explore.
- Sidebar: Playbooks view all opens Playbooks.
- Sidebar: Chats view all opens Recent Chats.
- Sidebar and Recent Chats chat rows open selected Chat.
- Sidebar, Playbooks, and Explore playbook rows open Playbook Detail.
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
| Playbook Detail | 393 x 852 | 393 x 852 | 0 |
| Ask Alva Overlay | 393 x 852 | 393 x 852 | 0 |
| Info Modal | 393 x 852 | 393 x 852 | 0 |
| Profile | 393 x 852 | 393 x 852 | 0 |
| Selected Chat | 393 x 852 | 393 x 852 | 0 |

## Notes

- The visible UI uses Figma-exported state images as the visual baseline for pixel parity.
- Interaction is implemented with scaled hotspots and React state transitions.
- Page changes, overlay entry, and modal entry use short eased animations.
