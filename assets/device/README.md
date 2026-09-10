# Simulated Android System Chrome

Only the desktop device simulator uses these assets. Product icons and fonts
remain unchanged. This is a common Android gesture-navigation preview, not a
claim to reproduce every manufacturer's OS version or user setting.

Downloaded 2026-09-10, unmodified:

- `wifi.svg`, `signal.svg`, `battery.svg`: Google Material Icons,
  [source](https://github.com/google/material-design-icons/tree/master/src/device),
  `signal_wifi_4_bar`, `signal_cellular_4_bar`, `battery_full`, filled 24px.
  License: `Material-Icons-LICENSE.txt` (Apache 2.0).
- `Roboto-Medium.ttf`: Google Fonts Roboto 500, from the
  [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Roboto:wght@500).
  License: `Roboto-OFL.txt` (SIL OFL 1.1).

Insets and gesture-navigation behavior follow the
[Android system-bar guidance](https://developer.android.com/design/ui/mobile/guides/foundations/system-bars).
`shell.js` owns the preset safe-area heights. `device-chrome.css` owns status
alignment, platform assets, indicator dimensions and native-browser removal.
