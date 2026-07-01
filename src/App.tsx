import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Screen =
  | "login"
  | "chat"
  | "sidebar"
  | "sidebarMenu"
  | "playbooks"
  | "recentChats"
  | "explore"
  | "playbookDetail"
  | "chatSelected"
  | "profile"
  | "settings";

type Overlay = "askAlva" | "infoModal" | null;
type Direction = "forward" | "back" | "overlay";
type DetailTab = "overview" | "analytics" | "strategy" | "feed";
type SettingsTab = "account" | "usage" | "portfolio" | "alvaAgent" | "alerts" | "apiKey";

type Narrative = {
  title: string;
  summary: string;
  details: string[];
};

type ScreenMeta = {
  src: string;
  height: number;
  label: string;
  cropTop?: number;
  scroll?: boolean;
  sourceHeight?: number;
};

type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: () => void;
};

const DESIGN_WIDTH = 393;
const SYSTEM_STATUS_HEIGHT = 59;
const SAFARI_BOTTOM_BAR_HEIGHT = 134;
const STANDARD_SOURCE_HEIGHT = 852;
const STANDARD_VIEW_HEIGHT = STANDARD_SOURCE_HEIGHT - SYSTEM_STATUS_HEIGHT - SAFARI_BOTTOM_BAR_HEIGHT;
const PROFILE_VIEW_HEIGHT = STANDARD_SOURCE_HEIGHT - SYSTEM_STATUS_HEIGHT;
const DETAIL_TOP_HEIGHT = 120;
const DETAIL_VIEW_HEIGHT = STANDARD_VIEW_HEIGHT;
const DETAIL_FOOTER_VIEWPORT_Y = 573;
const DETAIL_FOOTER_HEIGHT = 86;
const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const detailTabs: Record<DetailTab, { src: string; height: number; label: string; narrative: Narrative }> = {
  overview: {
    src: assetPath("screens/detail-tabs/overview.png"),
    height: 2218,
    label: "Overview",
    narrative: {
      title: "Quality Value Stock Screener detail: Overview",
      summary: "Overview tab content from the supplied Figma frame with creator, metrics, equity curve, returns, and drawdown modules.",
      details: [
        "The product header and fixed bottom actions remain aligned to the chrome-free mobile detail frame.",
        "The Overview content area is the 393 by 2218 export from Figma node 9949:133037.",
      ],
    },
  },
  analytics: {
    src: assetPath("screens/detail-tabs/analytics.png"),
    height: 1644,
    label: "Analytics",
    narrative: {
      title: "Quality Value Stock Screener detail: Analytics",
      summary: "Analytics tab content from the supplied Figma frame with return, risk, and distribution analysis.",
      details: [
        "The Analytics content area is the 393 by 1644 export from Figma node 9949:133040.",
        "Tab switching keeps the same playbook shell and resets the scroll position to the top.",
      ],
    },
  },
  strategy: {
    src: assetPath("screens/detail-tabs/strategy.png"),
    height: 1112,
    label: "Strategy",
    narrative: {
      title: "Quality Value Stock Screener detail: Strategy",
      summary: "Strategy tab content from the supplied Figma frame with objective and strategy copy blocks.",
      details: [
        "The Strategy content area is the 393 by 1112 export from Figma node 9949:133039.",
        "The fixed Ask Alva, Remix, Trade, and Subscribe action area stays available over the tab content.",
      ],
    },
  },
  feed: {
    src: assetPath("screens/detail-tabs/feed.png"),
    height: 1956,
    label: "Feed",
    narrative: {
      title: "Quality Value Stock Screener detail: Feed",
      summary: "Feed tab content from the supplied Figma frame with playbook updates and market posts.",
      details: [
        "The Feed content area is the 393 by 1956 export from Figma node 9949:133038.",
        "The tab content scrolls behind the fixed bottom shell to match the mobile composition.",
      ],
    },
  },
};

const detailTabHitAreas: Array<{ tab: DetailTab; x: number; width: number }> = [
  { tab: "overview", x: 0, width: 98 },
  { tab: "analytics", x: 98, width: 98 },
  { tab: "strategy", x: 196, width: 98 },
  { tab: "feed", x: 294, width: 99 },
];

const settingsTabHitAreas: Array<{ tab: SettingsTab; x: number; width: number }> = [
  { tab: "account", x: 0, width: 75 },
  { tab: "usage", x: 75, width: 64 },
  { tab: "portfolio", x: 139, width: 76 },
  { tab: "alvaAgent", x: 215, width: 90 },
  { tab: "alerts", x: 305, width: 46 },
  { tab: "apiKey", x: 351, width: 42 },
];

const settingsTab = (
  src: string,
  sourceHeight: number,
  label: string,
  narrative: Narrative,
): { src: string; height: number; label: string; sourceHeight: number; narrative: Narrative } => ({
  src: assetPath(src),
  sourceHeight,
  height: sourceHeight - SYSTEM_STATUS_HEIGHT - SAFARI_BOTTOM_BAR_HEIGHT,
  label,
  narrative,
});

const settingsTabs: Record<
  SettingsTab,
  { src: string; height: number; label: string; sourceHeight: number; narrative: Narrative }
> = {
  account: settingsTab("screens/settings-tabs/account.png", 1231, "Account", {
    title: "Settings: Account",
    summary: "Account settings tab with profile identity, user information, and connected accounts from the supplied Figma frame.",
    details: [
      "The browser status chrome and Safari bar are cropped out for real mobile browser viewing.",
      "Visible sections include Sheer, Nickname, User Info, and Connections.",
    ],
  }),
  usage: settingsTab("screens/settings-tabs/usage.png", 1849, "Usage", {
    title: "Settings: Usage",
    summary: "Usage settings tab with Pro subscription, credits, billing, and detailed usage modules.",
    details: [
      "This is the longest settings tab and remains fully scrollable after chrome cropping.",
      "Tab switching resets the settings scroll position to the top.",
    ],
  }),
  portfolio: settingsTab("screens/settings-tabs/portfolio.png", 1255, "Portfolio", {
    title: "Settings: Portfolio",
    summary: "Portfolio settings tab with broker connections and global risk rules.",
    details: [
      "Broker connection cards and risk controls match the adjacent Figma settings frame.",
      "The top settings tab row remains tappable from the rendered screenshot layer.",
    ],
  }),
  alvaAgent: settingsTab("screens/settings-tabs/alva-agent.png", 1169, "Alva Agent", {
    title: "Settings: Alva Agent",
    summary: "Alva Agent settings tab with connected apps, assistant customization, and generated memory settings.",
    details: [
      "The page preserves Figma typography, variables, icon assets, and spacing by using the direct frame export.",
      "Back and tab controls are added as invisible interaction hotspots.",
    ],
  }),
  alerts: settingsTab("screens/settings-tabs/alerts.png", 1139, "Alerts", {
    title: "Settings: Alerts",
    summary: "Alerts settings tab with market digest and watch alert cards.",
    details: [
      "Visible alert items include Market Pulse Digest, AI Earnings Radar, GLP-1 Trial Watch, and space-rs-rotation.",
      "The active tab state is captured from the adjacent settings design.",
    ],
  }),
  apiKey: settingsTab("screens/settings-tabs/api-key.png", 1237, "API Key", {
    title: "Settings: API Key",
    summary: "API Key settings tab with Alva API keys, secrets vault, and quick start content.",
    details: [
      "The API Key tab uses the adjacent mobile settings export from the same Figma page.",
      "Chrome-free cropping keeps only the content that will appear inside the phone browser.",
    ],
  }),
};

const screenNarratives: Record<Screen | Exclude<Overlay, null>, Narrative> = {
  login: {
    title: "Login",
    summary: "Alva login screen with email, Google, X, Telegram, Discord, and Cloudflare verification options.",
    details: [
      "Slogan: Turn ideas into live investing playbooks in minutes.",
      "Offer: sign up to unlock 3-day Pro, 8 dollars credits, and full data access.",
    ],
  },
  chat: {
    title: "Alva Agent chat",
    summary: "Chat tab showing a FinTwit Digest setup conversation and delivery destination options.",
    details: [
      "User request: create today's FinTwit Digest from a chosen FinTwit list.",
      "Alva answer includes a Daily Digest market report summary and Telegram, Discord, WhatsApp actions.",
    ],
  },
  sidebar: {
    title: "Sidebar",
    summary: "Navigation menu with upgrade banner, Explore, Portfolio, Alva Skill, FinTwit Alpha League, playbooks, chats, and Ask Alva.",
    details: [
      "Playbooks include Investor Roundtable, LAB Short War Room, Citrini Operating System, Theme Tracker Humanoid Robots, and BTC Bet Scanner.",
      "Recent chats include Crypto Price plus AI Trend Pulse, AVGO earnings recap, Macro and rates this week, Semis versus power-grid rotation, and NVDA options flow check.",
    ],
  },
  sidebarMenu: {
    title: "Sidebar account menu",
    summary: "Account menu popover opened from the sidebar avatar with user identity, usage, referral, earnings, language, settings, and log out rows.",
    details: [
      "The user information area opens the full profile page.",
      "The Settings row opens the mobile Settings page and its tabbed content.",
    ],
  },
  playbooks: {
    title: "Playbooks",
    summary: "Playbooks list with All, Subscribed, and Created tabs plus status filters.",
    details: [
      "Visible playbooks include Investor Roundtable, LAB Short War Room, Citrini Operating System, Theme Tracker Humanoid Robots, and BTC Bet Scanner.",
    ],
  },
  recentChats: {
    title: "Recent Chats",
    summary: "Recent chat list with a New Chat button and timestamped market conversation threads.",
    details: [
      "Visible chats include Crypto Price plus AI Trend Pulse, AVGO earnings recap, Macro and rates this week, Semis versus power-grid rotation, NVDA options flow check, AI infra shipment watch, and FOMC liquidity map.",
    ],
  },
  explore: {
    title: "Explore",
    summary: "Explore feed with category chips and market playbook cards.",
    details: [
      "Cards include BTC Ultimate AI Trader, MAG7 Equal-Weight Monthly Rebalance, PEPE Long versus BTC Short Monitoring, Attribution Analysis Strategy, and BTC MACD 1h Simple Crossover.",
    ],
  },
  playbookDetail: {
    title: "Quality Value Stock Screener detail",
    summary: "Playbook detail with Overview, Analytics, Strategy, and Feed tab content from the supplied Figma frame.",
    details: [
      "The tab content area uses the four direct exports from Figma node 9949:133034.",
      "Floating actions include Ask Alva, Remix, Trade, and Subscribe.",
    ],
  },
  chatSelected: {
    title: "Daily FinTwit Digest chat",
    summary: "Selected chat thread for Daily FinTwit Digest scheduling.",
    details: [
      "Alva asks whether to deliver the digest automatically each morning.",
      "User confirms Telegram delivery daily at 7:30 AM, then Alva confirms the schedule.",
    ],
  },
  profile: {
    title: "Profile",
    summary: "Owner profile page for YGGYLL with creator identity, social handles, stats, edit and share actions, and playbook tabs.",
    details: [
      "Stats include 6 playbooks, 890 stars, 12 remix, and 1,203.45 dollars earned.",
      "Visible tabs include My Playbooks, My starred, and My purchased, with All, Public, Private, and Paid filters.",
    ],
  },
  settings: {
    title: "Settings",
    summary: "Mobile Settings page with Account, Usage, Portfolio, Alva Agent, Alerts, and API Key tabs from the supplied Figma frames.",
    details: [
      "Entered from the Settings item in the sidebar menu.",
      "Each tab uses a direct Figma export with system status and Safari browser bars cropped out of the demo.",
    ],
  },
  askAlva: {
    title: "Ask Alva overlay",
    summary: "Bottom chat overlay opened from the playbook detail page.",
    details: [
      "Overlay shows Daily FinTwit Digest chat with controls for close, new chat, expand, attachment chip, and message input.",
    ],
  },
  infoModal: {
    title: "Playbook information modal",
    summary: "Centered modal describing Quality Value Stock Screener with owner, tags, automations, metrics, and description.",
    details: [
      "Metrics include 2.6K views, 24 comments, 12 remix, and 138 subscribed.",
      "Description explains AI infrastructure investment thesis tracking across silicon, networking, hyperscalers, power, and data centers.",
    ],
  },
};

const chromeFreeScreen = (src: string, label: string): ScreenMeta => ({
  src: assetPath(src),
  height: STANDARD_VIEW_HEIGHT,
  label,
  cropTop: SYSTEM_STATUS_HEIGHT,
  sourceHeight: STANDARD_SOURCE_HEIGHT,
});

const screens: Record<Screen | Exclude<Overlay, null>, ScreenMeta> = {
  login: chromeFreeScreen("screens/login.png", "Login"),
  chat: chromeFreeScreen("screens/chat.png", "Alva Agent chat"),
  sidebar: {
    src: assetPath("screens/sidebar.png"),
    height: 1313 - SYSTEM_STATUS_HEIGHT - SAFARI_BOTTOM_BAR_HEIGHT,
    label: "Sidebar",
    cropTop: SYSTEM_STATUS_HEIGHT,
    scroll: true,
    sourceHeight: 1313,
  },
  sidebarMenu: chromeFreeScreen("screens/sidebar-menu.png", "Sidebar account menu"),
  playbooks: chromeFreeScreen("screens/playbooks.png", "Playbooks"),
  recentChats: chromeFreeScreen("screens/recent-chats.png", "Recent Chats"),
  explore: chromeFreeScreen("screens/explore.png", "Explore"),
  playbookDetail: chromeFreeScreen("screens/playbook-detail.png", "Playbook detail"),
  chatSelected: chromeFreeScreen("screens/chat-selected.png", "Selected chat"),
  profile: {
    src: assetPath("screens/profile.png"),
    height: PROFILE_VIEW_HEIGHT,
    label: "Profile",
    cropTop: SYSTEM_STATUS_HEIGHT,
    sourceHeight: STANDARD_SOURCE_HEIGHT,
  },
  settings: {
    src: settingsTabs.account.src,
    height: settingsTabs.account.height,
    label: "Settings",
    cropTop: SYSTEM_STATUS_HEIGHT,
    sourceHeight: settingsTabs.account.sourceHeight,
  },
  askAlva: chromeFreeScreen("screens/ask-alva-overlay.png", "Ask Alva overlay"),
  infoModal: chromeFreeScreen("screens/info-modal.png", "Info modal"),
};

function HotspotButton({ cropTop = 0, frameHeight, hotspot }: { cropTop?: number; hotspot: Hotspot; frameHeight: number }) {
  const style = {
    left: `${(hotspot.x / DESIGN_WIDTH) * 100}%`,
    top: `${((hotspot.y - cropTop) / frameHeight) * 100}%`,
    width: `${(hotspot.width / DESIGN_WIDTH) * 100}%`,
    height: `${(hotspot.height / frameHeight) * 100}%`,
  };

  return (
    <button
      aria-label={hotspot.label}
      className="hotspot"
      data-hotspot={hotspot.id}
      onClick={(event) => {
        event.stopPropagation();
        hotspot.action();
      }}
      style={style}
      type="button"
    />
  );
}

function DetailScreen({
  animationTick,
  direction,
  onAskAlva,
  onBack,
  onInfo,
  onSelectTab,
  tab,
}: {
  animationTick: number;
  direction: Direction;
  onAskAlva: () => void;
  onBack: () => void;
  onInfo: () => void;
  onSelectTab: (tab: DetailTab) => void;
  tab: DetailTab;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTab = detailTabs[tab];
  const detailHeight = DETAIL_TOP_HEIGHT + activeTab.height + DETAIL_FOOTER_HEIGHT;
  const narrative = activeTab.narrative;
  const style = {
    "--detail-total-height": `${detailHeight}px`,
    "--detail-content-height": `${activeTab.height}px`,
  } as CSSProperties;

  const contentHotspots: Hotspot[] = [
    { id: "detail-back", label: "Back", x: 0, y: 65, width: 48, height: 48, action: onBack },
    { id: "detail-info", label: "Open playbook info", x: 260, y: 65, width: 42, height: 48, action: onInfo },
    ...detailTabHitAreas.map(({ tab: nextTab, x, width }) => ({
      id: `detail-tab-${nextTab}`,
      label: `Show ${detailTabs[nextTab].label}`,
      x,
      y: DETAIL_TOP_HEIGHT,
      width,
      height: 46,
      action: () => {
        scrollRef.current?.scrollTo(0, 0);
        onSelectTab(nextTab);
      },
    })),
  ];

  const fixedHotspots: Hotspot[] = [
    { id: "detail-ask-alva", label: "Ask Alva", x: 34, y: DETAIL_FOOTER_VIEWPORT_Y + 18, width: 84, height: 58, action: onAskAlva },
  ];

  return (
    <div className="detail-frame" data-current-detail-tab={tab}>
      <div className="sr-only" aria-live="polite">
        <h1>{narrative.title}</h1>
        <p>{narrative.summary}</p>
        <ul>
          {narrative.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <p>
          Available actions: Back, Open playbook info, Show Overview, Show Analytics, Show Strategy, Show Feed, Ask Alva.
        </p>
      </div>

      <div className="detail-scroll" ref={scrollRef}>
        <div className={`detail-scroll-content enter-${direction}`} key={`${tab}-${animationTick}`} style={style}>
          <img alt="" aria-hidden="true" className="detail-shell-top" draggable={false} src={assetPath("screens/detail-shell-top.png")} />
          <img alt="" aria-hidden="true" className="detail-tab-content" draggable={false} src={activeTab.src} />
          <div className="hotspot-layer detail-content-hotspots">
            {contentHotspots.map((hotspot) => (
              <HotspotButton frameHeight={detailHeight} hotspot={hotspot} key={hotspot.id} />
            ))}
          </div>
        </div>
      </div>

      <img alt="" aria-hidden="true" className="detail-shell-footer" draggable={false} src={assetPath("screens/detail-shell-footer.png")} />
      <div className="hotspot-layer detail-fixed-hotspots">
        {fixedHotspots.map((hotspot) => (
          <HotspotButton frameHeight={DETAIL_VIEW_HEIGHT} hotspot={hotspot} key={hotspot.id} />
        ))}
      </div>
    </div>
  );
}

function SettingsScreen({
  animationTick,
  direction,
  onBack,
  onSelectTab,
  tab,
}: {
  animationTick: number;
  direction: Direction;
  onBack: () => void;
  onSelectTab: (tab: SettingsTab) => void;
  tab: SettingsTab;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeTab = settingsTabs[tab];
  const narrative = activeTab.narrative;
  const style = {
    "--crop-top": `${SYSTEM_STATUS_HEIGHT}px`,
    "--screen-height": `${activeTab.height}px`,
    "--source-height": `${activeTab.sourceHeight}px`,
  } as CSSProperties;

  const settingsHotspots: Hotspot[] = [
    { id: "settings-back", label: "Back to sidebar", x: 0, y: 59, width: 56, height: 56, action: onBack },
    ...settingsTabHitAreas.map(({ tab: nextTab, x, width }) => ({
      id: `settings-tab-${nextTab}`,
      label: `Show ${settingsTabs[nextTab].label} settings`,
      x,
      y: 115,
      width,
      height: 48,
      action: () => {
        scrollRef.current?.scrollTo(0, 0);
        onSelectTab(nextTab);
      },
    })),
  ];

  return (
    <div className="settings-frame" data-current-settings-tab={tab}>
      <div className="sr-only" aria-live="polite">
        <h1>{narrative.title}</h1>
        <p>{narrative.summary}</p>
        <ul>
          {narrative.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <p>
          Available actions: Back to sidebar, Show Account settings, Show Usage settings, Show Portfolio settings, Show Alva Agent
          settings, Show Alerts settings, Show API Key settings.
        </p>
      </div>

      <div className="settings-scroll" ref={scrollRef}>
        <div className={`screen-visual enter-${direction}`} key={`${tab}-${animationTick}`} style={style}>
          <img alt="" aria-hidden="true" className="screen-image" draggable={false} src={activeTab.src} />
          <div className="hotspot-layer">
            {settingsHotspots.map((hotspot) => (
              <HotspotButton cropTop={SYSTEM_STATUS_HEIGHT} frameHeight={activeTab.height} hotspot={hotspot} key={hotspot.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const [animationTick, setAnimationTick] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [settingsTabName, setSettingsTabName] = useState<SettingsTab>("account");

  const navigate = (next: Screen, nextDirection: Direction = "forward") => {
    setOverlay(null);
    setHistory((items) => [...items, screen]);
    setDirection(nextDirection);
    setAnimationTick((value) => value + 1);
    setScreen(next);
  };

  const replace = (next: Screen, nextDirection: Direction = "forward") => {
    setOverlay(null);
    setDirection(nextDirection);
    setAnimationTick((value) => value + 1);
    setScreen(next);
  };

  const backTo = (fallback: Screen = "sidebar") => {
    setOverlay(null);
    setHistory((items) => {
      const nextHistory = [...items];
      const previous = nextHistory.pop() ?? fallback;
      setDirection("back");
      setAnimationTick((value) => value + 1);
      setScreen(previous);
      return nextHistory;
    });
  };

  const openOverlay = (nextOverlay: Exclude<Overlay, null>) => {
    setDirection("overlay");
    setOverlay(nextOverlay);
    setAnimationTick((value) => value + 1);
  };

  const closeOverlay = () => {
    setDirection("back");
    setOverlay(null);
    setAnimationTick((value) => value + 1);
  };

  const openDetail = () => {
    setDetailTab("overview");
    navigate("playbookDetail");
  };

  const openSettings = () => {
    setSettingsTabName("account");
    navigate("settings");
  };

  const selectDetailTab = (nextTab: DetailTab) => {
    if (nextTab === detailTab) {
      return;
    }

    setDirection("forward");
    setDetailTab(nextTab);
    setAnimationTick((value) => value + 1);
  };

  const selectSettingsTab = (nextTab: SettingsTab) => {
    if (nextTab === settingsTabName) {
      return;
    }

    setDirection("forward");
    setSettingsTabName(nextTab);
    setAnimationTick((value) => value + 1);
  };

  const viewKey = overlay ?? screen;
  const meta = screens[viewKey];

  const hotspots = useMemo<Hotspot[]>(() => {
    if (overlay === "askAlva") {
      return [
        { id: "ask-close", label: "Close Ask Alva", x: 0, y: 110, width: 55, height: 70, action: closeOverlay },
      ];
    }

    if (overlay === "infoModal") {
      return [
        { id: "info-close", label: "Close information modal", x: 324, y: 258, width: 54, height: 62, action: closeOverlay },
        { id: "info-backdrop", label: "Close information modal backdrop", x: 0, y: 0, width: 393, height: 852, action: closeOverlay },
      ];
    }

    switch (screen) {
      case "login":
        return [
          { id: "login-anywhere", label: "Complete login", x: 0, y: 0, width: 393, height: 852, action: () => replace("chat") },
        ];
      case "chat":
        return [
          { id: "chat-menu", label: "Open sidebar", x: 0, y: 123, width: 56, height: 56, action: () => navigate("sidebar") },
        ];
      case "sidebar":
        return [
          { id: "sidebar-avatar", label: "Open account menu", x: 337, y: 123, width: 56, height: 56, action: () => navigate("sidebarMenu") },
          { id: "sidebar-explore", label: "Open Explore", x: 0, y: 258, width: 190, height: 58, action: () => navigate("explore") },
          { id: "sidebar-playbooks-all", label: "View all playbooks", x: 313, y: 466, width: 78, height: 45, action: () => navigate("playbooks") },
          { id: "sidebar-recent-all", label: "View all recent chats", x: 313, y: 815, width: 78, height: 45, action: () => navigate("recentChats") },
          { id: "sidebar-playbook-1", label: "Open Investor Roundtable", x: 0, y: 502, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-2", label: "Open LAB Short War Room", x: 0, y: 563, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-3", label: "Open Citrini Operating System", x: 0, y: 624, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-4", label: "Open Theme Tracker", x: 0, y: 685, width: 393, height: 61, action: openDetail },
          { id: "sidebar-playbook-5", label: "Open BTC Bet Scanner", x: 0, y: 746, width: 393, height: 61, action: openDetail },
          { id: "sidebar-chat-1", label: "Open Crypto Price chat", x: 0, y: 894, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-2", label: "Open AVGO chat", x: 0, y: 944, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-3", label: "Open Macro rates chat", x: 0, y: 995, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-4", label: "Open Semis chat", x: 0, y: 1046, width: 393, height: 49, action: () => navigate("chatSelected") },
          { id: "sidebar-chat-5", label: "Open NVDA chat", x: 0, y: 1097, width: 393, height: 49, action: () => navigate("chatSelected") },
        ];
      case "sidebarMenu":
        return [
          { id: "sidebar-menu-back", label: "Back to sidebar", x: 0, y: 59, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "sidebar-menu-user", label: "Open profile", x: 0, y: 115, width: 393, height: 84, action: () => navigate("profile") },
          { id: "sidebar-menu-settings", label: "Open Settings", x: 0, y: 455, width: 393, height: 46, action: openSettings },
        ];
      case "playbooks":
        return [
          { id: "playbooks-back", label: "Back to sidebar", x: 0, y: 62, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "playbooks-item-1", label: "Open Investor Roundtable", x: 0, y: 193, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-2", label: "Open LAB Short War Room", x: 0, y: 254, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-3", label: "Open Citrini Operating System", x: 0, y: 315, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-4", label: "Open Theme Tracker", x: 0, y: 376, width: 393, height: 62, action: openDetail },
          { id: "playbooks-item-5", label: "Open BTC Bet Scanner", x: 0, y: 437, width: 393, height: 62, action: openDetail },
        ];
      case "recentChats":
        return [
          { id: "recent-back", label: "Back to sidebar", x: 0, y: 62, width: 56, height: 56, action: () => backTo("sidebar") },
          { id: "recent-chat-1", label: "Open Crypto Price chat", x: 0, y: 167, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-2", label: "Open AVGO chat", x: 0, y: 217, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-3", label: "Open Macro rates chat", x: 0, y: 267, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-4", label: "Open Semis chat", x: 0, y: 317, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-5", label: "Open NVDA chat", x: 0, y: 367, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-6", label: "Open AI infra chat", x: 0, y: 417, width: 393, height: 50, action: () => navigate("chatSelected") },
          { id: "recent-chat-7", label: "Open FOMC chat", x: 0, y: 467, width: 393, height: 50, action: () => navigate("chatSelected") },
        ];
      case "explore":
        return [
          { id: "explore-menu", label: "Open sidebar", x: 0, y: 59, width: 56, height: 56, action: () => navigate("sidebar", "back") },
          { id: "explore-card-1", label: "Open BTC Ultimate AI Trader", x: 0, y: 196, width: 393, height: 115, action: openDetail },
          { id: "explore-card-2", label: "Open MAG7 Equal-Weight", x: 0, y: 311, width: 393, height: 115, action: openDetail },
          { id: "explore-card-3", label: "Open PEPE Long vs BTC Short", x: 0, y: 426, width: 393, height: 115, action: openDetail },
          { id: "explore-card-4", label: "Open Attribution Analysis", x: 0, y: 541, width: 393, height: 115, action: openDetail },
          { id: "explore-card-5", label: "Open BTC MACD crossover", x: 0, y: 656, width: 393, height: 70, action: openDetail },
        ];
      case "playbookDetail":
        return [];
      case "chatSelected":
        return [
          { id: "selected-back", label: "Back", x: 0, y: 124, width: 48, height: 48, action: () => backTo("sidebar") },
        ];
      case "profile":
        return [
          { id: "profile-back", label: "Back to sidebar", x: 0, y: 65, width: 56, height: 56, action: () => backTo("sidebar") },
        ];
      case "settings":
        return [];
      default:
        return [];
    }
  }, [screen, overlay, detailTab]);

  const narrative = screenNarratives[viewKey];

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className="mobile-shell" aria-label="m.baby mobile demo">
        <div className={`screen-frame ${meta.scroll ? "screen-frame-scroll" : ""}`} data-current-view={viewKey} data-screen-height={meta.height}>
          {screen === "playbookDetail" && overlay === null ? (
            <DetailScreen
              animationTick={animationTick}
              direction={direction}
              onAskAlva={() => openOverlay("askAlva")}
              onBack={() => backTo("sidebar")}
              onInfo={() => openOverlay("infoModal")}
              onSelectTab={selectDetailTab}
              tab={detailTab}
            />
          ) : screen === "settings" && overlay === null ? (
            <SettingsScreen
              animationTick={animationTick}
              direction={direction}
              onBack={() => backTo("sidebar")}
              onSelectTab={selectSettingsTab}
              tab={settingsTabName}
            />
          ) : (
            <div
              className={`screen-visual enter-${direction}`}
              key={`${viewKey}-${animationTick}`}
              style={
                {
                  "--crop-top": `${meta.cropTop ?? 0}px`,
                  "--screen-height": `${meta.height}px`,
                  "--source-height": `${meta.sourceHeight ?? meta.height}px`,
                } as CSSProperties
              }
            >
              <div className="sr-only" aria-live="polite">
                <h1>{narrative.title}</h1>
                <p>{narrative.summary}</p>
                <ul>
                  {narrative.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <p>Available actions: {hotspots.map((hotspot) => hotspot.label).join(", ")}.</p>
              </div>
              <img alt="" aria-hidden="true" className="screen-image" draggable={false} src={meta.src} />
              <div className="hotspot-layer">
                {hotspots.map((hotspot) => (
                  <HotspotButton cropTop={meta.cropTop} frameHeight={meta.height} hotspot={hotspot} key={hotspot.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
