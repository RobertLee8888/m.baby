# Alva splash Lottie handoff

Delivery file: [`assets/alva-splash-reveal.json`](../assets/alva-splash-reveal.json)

This is the production handoff for the current mobile demo splash reveal. It
starts immediately from the complete Alva symbol + wordmark; the demo's
one-second static hold is intentionally not included.

## Motion spec

| Property | Value |
|---|---|
| Canvas | 1080 x 1920 px |
| Frame rate | 30 fps |
| Timeline | 11 frames / 366.7 ms |
| Loop | Off |
| Background | `#49A3A6` |
| Opening lockup | 460 px in the composition; about 204 x 50 pt at 393 x 852 aspect-fill |
| Assets | Pure vector; no images, fonts, or remote dependencies |
| Lottie version | 5.7.0 |

- Frames 0-2: full centered lockup contracts from 100% to 88%.
- Frames 2-3: lockup rebounds to 104%.
- Frames 3-10: the exact lockup becomes a centered negative-space aperture and
  expands with a strong ease-in acceleration.
- Frames 4.5-8.8: the remaining brand overlay fades out inside the same Lottie
  timeline so tall and wide mobile viewports both finish fully clear.
- Frame 10 onward: fully transparent; the app page underneath is completely
  visible.

## Integration

1. Mount the destination page before starting the animation and place the
   Lottie view above it as a full-viewport overlay.
2. Use aspect-fill / center-crop (`xMidYMid slice` on web). Do not letterbox the
   1080 x 1920 composition.
3. Play once at speed 1 from frame 0. There is no additional delay or static
   logo phase.
4. Remove the overlay from the view hierarchy on animation completion. Do not
   add a second CSS/native reveal animation.
5. For reduced-motion users, skip the Lottie and show the destination page
   immediately.

The animation uses an inverted alpha track matte, matching the capabilities
already used by the reference `splash.json`. Keep track mattes enabled in the
target Lottie runtime.

Regenerate after a logo asset change with:

```sh
node scripts/generate-splash-lottie.mjs
```
