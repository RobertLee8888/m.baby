import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUp,
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  Database,
  Edit3,
  Gift,
  Globe2,
  Hexagon,
  Info,
  KeyRound,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  SquarePen,
  Trophy,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
type DetailTab = "overview" | "analytics" | "strategy" | "feed";
type SettingsTab = "account" | "usage" | "portfolio" | "alvaAgent" | "alerts" | "apiKey";

type Playbook = {
  title: string;
  subtitle: string;
  avatar: string;
  cover: string;
  tag?: string;
  stat?: string;
};

type ChatItem = {
  title: string;
  time: string;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const playbooks: Playbook[] = [
  {
    title: "Investor Roundtable",
    subtitle: "Ten legendary investors debate any stock - live verdict",
    avatar: asset("assets/avatars/ava-1.png"),
    cover: asset("assets/covers/cover-roundtable.webp"),
    tag: "Debate",
    stat: "2.6K",
  },
  {
    title: "LAB Short War Room",
    subtitle: "Live short-seller console for LABUSDT - squeeze risk",
    avatar: asset("assets/avatars/ava-2.png"),
    cover: asset("assets/covers/cover-lab.webp"),
    tag: "Crypto",
    stat: "1.8K",
  },
  {
    title: "Citrini Operating System",
    subtitle: "Six modules - live macro indicators + megatrend tracker",
    avatar: asset("assets/avatars/ava-3.png"),
    cover: asset("assets/covers/cover-citrini.webp"),
    tag: "Macro",
    stat: "9.1K",
  },
  {
    title: "Theme Tracker - Humanoid Robots",
    subtitle: "75 names across 9 supply-chain layers, scored daily",
    avatar: asset("assets/avatars/av-zet.jpeg"),
    cover: asset("assets/covers/cover-btcprice.webp"),
    tag: "Theme",
    stat: "3.2K",
  },
  {
    title: "BTC Bet Scanner",
    subtitle: "Polymarket BTC daily-close - 4-way probability blend",
    avatar: asset("assets/avatars/ava-5.png"),
    cover: asset("assets/covers/cover-btcbet.webp"),
    tag: "Polymarket",
    stat: "5.7K",
  },
];

const chats: ChatItem[] = [
  { title: "Crypto Price + AI Trend Pulse", time: "2 min ago" },
  { title: "$AVGO earnings recap", time: "26 min ago" },
  { title: "Macro & rates this week", time: "1 hour ago" },
  { title: "Semis vs power-grid rotation", time: "4 hours ago" },
  { title: "NVDA options flow check", time: "Yesterday" },
  { title: "AI infra shipment watch", time: "Tue" },
  { title: "FOMC liquidity map", time: "Mon" },
];

const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Account" },
  { id: "usage", label: "Usage" },
  { id: "portfolio", label: "Portfolio" },
  { id: "alvaAgent", label: "Alva Agent" },
  { id: "alerts", label: "Alerts" },
  { id: "apiKey", label: "API Key" },
];

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "strategy", label: "Strategy" },
  { id: "feed", label: "Feed" },
];

function IconButton({
  label,
  icon: Icon,
  onClick,
  className = "",
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button aria-label={label} className={`icon-button ${className}`} onClick={onClick} type="button">
      <Icon size={20} strokeWidth={1.6} />
    </button>
  );
}

function Page({
  children,
  className = "",
  scroll = false,
}: {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return <div className={`page ${scroll ? "page-scroll" : ""} ${className}`}>{children}</div>;
}

function TopAd() {
  return (
    <div className="ad-banner">
      <span>{"Which FinTwit accounts actually make money? We backtested their posts so you know where to find alpha ->"}</span>
      <X size={16} strokeWidth={1.5} />
    </div>
  );
}

function Logo({ size = "large" }: { size?: "large" | "small" }) {
  return (
    <div className={`logo-mark logo-${size}`} aria-label="Alva">
      <img src={asset("assets/logos/alva-logo.svg")} alt="" />
    </div>
  );
}

function TopBar({
  title,
  left,
  right,
  border = true,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div className={`topbar ${border ? "topbar-border" : ""}`}>
      <div className="topbar-side">{left}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-right">{right}</div>
    </div>
  );
}

function TabRow<T extends string>({
  items,
  active,
  onChange,
  compact = false,
}: {
  items: Array<{ id: T; label: string }>;
  active: T;
  onChange: (next: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={`tab-row ${compact ? "tab-row-compact" : ""}`}>
      {items.map((item) => (
        <button
          className={`tab-item ${active === item.id ? "active" : ""}`}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={`pill ${active ? "pill-active" : ""}`}>{children}</span>;
}

function Avatar({ src, size = 36 }: { src: string; size?: number }) {
  return <img alt="" className="avatar" height={size} src={src} width={size} />;
}

function NavRow({
  icon: Icon,
  label,
  active = false,
  onClick,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button className={`nav-row ${active ? "active" : ""}`} onClick={onClick} type="button">
      <Icon size={19} strokeWidth={1.55} />
      <span>{label}</span>
      {badge ? <span className="mini-badge">{badge}</span> : null}
    </button>
  );
}

function PlaybookRow({ item, onClick }: { item: Playbook; onClick?: () => void }) {
  return (
    <button className="playbook-row" onClick={onClick} type="button">
      <Avatar src={item.avatar} />
      <span className="row-copy">
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>
      </span>
    </button>
  );
}

function ChatRow({ item, onClick }: { item: ChatItem; onClick?: () => void }) {
  return (
    <button className="chat-row" onClick={onClick} type="button">
      <MessageSquare size={18} strokeWidth={1.5} />
      <span>{item.title}</span>
      <time>{item.time}</time>
    </button>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <Page className="login-page">
      <div className="login-hero">
        <Logo />
        <h1>Turn ideas into live investing playbooks in minutes</h1>
        <p>Log in to build, remix, and trade.</p>
      </div>

      <button className="promo-card" onClick={onLogin} type="button">
        <span className="promo-icon">
          <Gift size={25} strokeWidth={1.7} />
        </span>
        <span>
          <strong>Sign up to unlock 3-day Pro</strong>
          <small>$8 credits · Full data access</small>
        </span>
      </button>

      <button className="email-button" onClick={onLogin} type="button">
        Login with Email
      </button>

      <div className="divider">
        <span />
        <small>or</small>
        <span />
      </div>

      <div className="social-grid">
        {["G", "X", "Tg", "D"].map((item) => (
          <button key={item} onClick={onLogin} type="button">
            {item}
          </button>
        ))}
      </div>

      <button className="human-check" onClick={onLogin} type="button">
        <span className="checkbox" />
        <span>Verify you are human</span>
        <span className="cloudflare">
          <Zap size={14} fill="#f59d2a" strokeWidth={0} />
          Cloudflare
          <small>Privacy · Terms</small>
        </span>
      </button>

      <p className="terms">
        By signing in, you agree to the Terms of Service and Privacy
        <br />
        Policy
      </p>
    </Page>
  );
}

function ChatPage({ onMenu }: { onMenu: () => void }) {
  return (
    <Page className="chat-page">
      <TopAd />
      <TopBar
        title="Alva Agent"
        left={<IconButton icon={Menu} label="Open sidebar" onClick={onMenu} />}
        right={<IconButton icon={Hexagon} label="Settings" />}
      />
      <TabRow
        active="chat"
        items={[
          { id: "chat", label: "Chat" },
          { id: "tasks", label: "Tasks (5)" },
          { id: "memory", label: "Memory" },
          { id: "alerts", label: "Alerts (8)" },
          { id: "files", label: "Files (8)" },
        ]}
        onChange={() => undefined}
      />
      <div className="chat-scroll">
        <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
        <div className="agent-label">
          <span className="agent-icon">
            <Bot size={18} />
          </span>
          <strong>Alva</strong>
        </div>
        <article className="digest-card">
          <header>
            <h2>Daily Digest · Market Digest</h2>
            <button type="button">Open full report</button>
          </header>
          <Pill>
            <span className="teal-dot" /> nvda-macd-hft-notify
          </Pill>
          <p className="muted">English · Jun 15 · Daily Digest · Previous day · Based on 53 FinTwits</p>
          <div className="card-divider" />
          <p>
            Top-ranked traders clustered around $NVDA, $000660.KS, $AKAM, $AMPG, and $AVGO in this window.
          </p>
          <p>
            The strongest current theme is AI infrastructure and cloud names, with $NVDA receiving repeated attention while
            $AVGO appears as a possible funding short.
          </p>
        </article>
      </div>
      <Composer />
    </Page>
  );
}

function Composer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`composer ${compact ? "composer-compact" : ""}`}>
      <Plus size={21} strokeWidth={1.5} />
      <span>Ask Alva anything. @ for context, / for skills</span>
      <button type="button">
        <ArrowUp size={17} strokeWidth={1.7} />
      </button>
    </div>
  );
}

function SidebarPage({
  onAccount,
  onExplore,
  onPlaybooks,
  onRecentChats,
  onPlaybook,
  onChat,
}: {
  onAccount: () => void;
  onExplore: () => void;
  onPlaybooks: () => void;
  onRecentChats: () => void;
  onPlaybook: () => void;
  onChat: () => void;
}) {
  return (
    <Page className="sidebar-page" scroll>
      <TopAd />
      <div className="sidebar-head">
        <Logo size="small" />
        <button className="avatar-button" onClick={onAccount} type="button">
          <Avatar size={34} src={asset("assets/avatars/av-zet.jpeg")} />
        </button>
      </div>
      <button className="upgrade-card" type="button">
        <span className="upgrade-icon">
          <ArrowUp size={24} />
        </span>
        <span>
          <strong>Upgrade to Pro</strong>
          <small>Unlock unlimited playbooks with 7-day free trial</small>
        </span>
        <ChevronRight size={17} />
      </button>

      <nav className="side-nav">
        <NavRow icon={Compass} label="Explore" onClick={onExplore} />
        <NavRow icon={Briefcase} label="Portfolio" />
        <NavRow icon={SquarePen} label="Alva Skill" />
        <NavRow active icon={Trophy} label="FinTwit Alpha League" />
      </nav>

      <SectionHeader action="View all" onAction={onPlaybooks} title="Playbooks" />
      <div className="list-stack">
        {playbooks.map((item) => (
          <PlaybookRow item={item} key={item.title} onClick={onPlaybook} />
        ))}
      </div>

      <SectionHeader action="View all" onAction={onRecentChats} title="Chats" />
      <button className="new-chat" type="button">
        <SquarePen size={14} /> New Chat
      </button>
      <div className="list-stack chat-stack">
        {chats.slice(0, 5).map((item) => (
          <ChatRow item={item} key={item.title} onClick={onChat} />
        ))}
      </div>
      <button className="ask-fab" type="button">
        <MessageCircle size={17} /> Ask Alva
      </button>
    </Page>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action ? (
        <button onClick={onAction} type="button">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function SidebarMenuPage({ onBack, onProfile, onSettings }: { onBack: () => void; onProfile: () => void; onSettings: () => void }) {
  return (
    <Page className="account-menu-page">
      <TopBar border={false} left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />} title="" />
      <button className="account-user" onClick={onProfile} type="button">
        <Avatar size={48} src={asset("assets/avatars/av-zet.jpeg")} />
        <span>
          <strong>sheer</strong>
          <span className="inline-tags">
            <Pill>Pro</Pill>
            <Pill>Annual</Pill>
          </span>
          <small>
            <span className="google-dot">G</span> sheer@alva.xyz
          </small>
        </span>
        <ChevronRight size={18} />
      </button>

      <div className="account-list">
        <MenuItem icon={Database} label="Usage" />
        <div className="usage-card">
          <span>
            <small>Available</small>
            <strong>12,000</strong>
          </span>
          <span className="usage-lines">
            <small>Daily <b>1,000</b></small>
            <small>Monthly <b>3,000</b></small>
            <small>Pack <b>12,000</b></small>
          </span>
        </div>
        <MenuItem icon={Gift} label="Referral" />
        <MenuItem icon={WalletCards} label="Creator Earnings" status />
        <MenuItem icon={Globe2} label="Language" />
        <MenuItem icon={Settings} label="Settings" onClick={onSettings} />
        <MenuItem icon={LogOut} label="Log Out" />
      </div>
      <div className="account-socials">
        {["Discord", "Telegram", "X", "Docs"].map((item) => (
          <button key={item} type="button">
            {item === "X" ? "X" : item.slice(0, 1)}
          </button>
        ))}
      </div>
    </Page>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  status = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  status?: boolean;
}) {
  return (
    <button className="menu-item" onClick={onClick} type="button">
      <Icon size={19} strokeWidth={1.55} />
      <span>{label}</span>
      {status ? <span className="status-dot" /> : null}
      <ChevronRight size={17} />
    </button>
  );
}

function PlaybooksPage({ onBack, onOpen }: { onBack: () => void; onOpen: () => void }) {
  return (
    <Page className="plain-list-page">
      <TopBar border={false} left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />} title="Playbooks" />
      <TabRow
        active="all"
        items={[
          { id: "all", label: "All" },
          { id: "subscribed", label: "Subscribed" },
          { id: "created", label: "Created" },
        ]}
        onChange={() => undefined}
      />
      <div className="filter-row">
        <Pill>All</Pill>
        <Pill active>Running</Pill>
        <Pill>Paused</Pill>
        <Pill>Draft</Pill>
      </div>
      <div className="list-stack large-list">
        {playbooks.map((item) => (
          <PlaybookRow item={item} key={item.title} onClick={onOpen} />
        ))}
      </div>
    </Page>
  );
}

function RecentChatsPage({ onBack, onChat }: { onBack: () => void; onChat: () => void }) {
  return (
    <Page className="plain-list-page">
      <TopBar border={false} left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />} title="Recent Chats" />
      <button className="primary-outline" type="button">
        <SquarePen size={15} /> New Chat
      </button>
      <div className="list-stack chat-stack full">
        {chats.map((item) => (
          <ChatRow item={item} key={item.title} onClick={onChat} />
        ))}
      </div>
    </Page>
  );
}

function ExplorePage({ onMenu, onOpen }: { onMenu: () => void; onOpen: () => void }) {
  return (
    <Page className="explore-page" scroll>
      <TopBar
        left={<IconButton icon={Menu} label="Open sidebar" onClick={onMenu} />}
        right={<IconButton icon={Search} label="Search" />}
        title="Explore"
      />
      <div className="explore-tabs">
        {["All", "Trading", "Macro", "Crypto", "AI"].map((item, index) => (
          <Pill active={index === 0} key={item}>
            {item}
          </Pill>
        ))}
      </div>
      <div className="explore-stack">
        {[
          "BTC Ultimate AI Trader",
          "MAG7 Equal-Weight Monthly Rebalance",
          "PEPE Long vs BTC Short Monitoring",
          "Attribution Analysis Strategy",
          "BTC MACD 1h Simple Crossover",
        ].map((title, index) => (
          <button className="explore-card" key={title} onClick={onOpen} type="button">
            <img alt="" src={playbooks[index % playbooks.length].cover} />
            <span>
              <strong>{title}</strong>
              <small>{index % 2 === 0 ? "Running · Public" : "Backtest · Paid"}</small>
              <em>{index + 12} signals · {index + 3}.2K views</em>
            </span>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
    </Page>
  );
}

function SettingsPage({
  active,
  onBack,
  onTab,
}: {
  active: SettingsTab;
  onBack: () => void;
  onTab: (tab: SettingsTab) => void;
}) {
  return (
    <Page className="settings-page" scroll>
      <TopBar border={false} left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />} title="Settings" />
      <TabRow active={active} compact items={settingsTabs} onChange={onTab} />
      <div className="settings-content">
        {active === "account" ? <SettingsAccount /> : null}
        {active === "usage" ? <SettingsUsage /> : null}
        {active === "portfolio" ? <SettingsPortfolio /> : null}
        {active === "alvaAgent" ? <SettingsAgent /> : null}
        {active === "alerts" ? <SettingsAlerts /> : null}
        {active === "apiKey" ? <SettingsApi /> : null}
      </div>
    </Page>
  );
}

function SettingsAccount() {
  return (
    <>
      <div className="profile-mini">
        <Avatar size={48} src={asset("assets/avatars/av-zet.jpeg")} />
        <span>
          <strong>Sheer</strong>
          <small>UID 13458677909324 · Joined 12/31/2025</small>
        </span>
      </div>
      <div className="two-buttons">
        <button type="button">Profile</button>
        <button className="danger" type="button">Log out</button>
      </div>
      <Field label="Nickname" value="Sheer" />
      <label className="field-block">
        <span>User info</span>
        <textarea placeholder="Introduce about yourself..." maxLength={500} />
        <small>0/500</small>
      </label>
      <h3>Connections</h3>
      <Connection icon="G" label="Gmail" sub="sheer@alva.xyz" action="Login Account" />
    </>
  );
}

function SettingsUsage() {
  return (
    <>
      <div className="plan-card">
        <div>
          <strong>Pro</strong>
          <Pill>Annually</Pill>
        </div>
        <button type="button">View all plans</button>
        <small>Start Date 06/06/2026 · Next Billing 06/06/2027</small>
        <div className="two-buttons">
          <button className="filled" type="button">Add credits</button>
          <button type="button">Manage</button>
        </div>
      </div>
      <MetricCard label="Available" value="10,000" sub="Credits" />
      <Notice>Your subscription will expire on Jan 8, 2027 and you will be downgraded to Free afterwards</Notice>
      <UsageBar label="Daily" value="800 / 1,000" percent={80} />
      <UsageBar label="Monthly" value="8,640 / 21,360" percent={40} />
      <UsageBar label="Pack" value="2,920" percent={18} />
    </>
  );
}

function SettingsPortfolio() {
  return (
    <>
      <SectionHeader action="+ Add" title="Broker Connections" />
      <Connection icon="IB" label="Interactive Brokers" sub="U***7338 · Live" action="Disconnect" />
      <Connection icon="BN" label="Binance" sub="U***7905 · Spot" action="Disconnect" />
      <Connection icon="AP" label="Alpaca" sub="U***7130 · Live" action="Disconnect" />
      <h3>Global Risk Rules</h3>
      <ToggleRow label="Max Single Order" value="$5,000" enabled />
      <ToggleRow label="Max Daily Turnover" value="-" />
      <ToggleRow label="Hard Stop Loss" value="8%" />
    </>
  );
}

function SettingsAgent() {
  return (
    <>
      <div className="connected-app">
        <span>Connected App</span>
        <button type="button">
          <Send size={14} /> Telegram <ChevronDown size={14} />
        </button>
      </div>
      <Connection icon="Tg" label="Telegram" sub="Sheername" action="Disconnect" />
      <Connection icon="D" label="Discord" sub="Join the community and chat with other traders." action="Connect" />
      <ToggleRow label="Customize Your Assistant" enabled />
      <textarea className="assistant-text" placeholder="Define your assistant's identity: name, tone, and..." />
      <ToggleRow label="Generate Memory from Chat History" enabled />
      <div className="quote-box">"How to apply..." when looking up design tokens, component specs, and market context.</div>
    </>
  );
}

function SettingsAlerts() {
  return (
    <>
      <div className="filter-row tight">
        <Pill active>All</Pill>
        <Pill>Active</Pill>
        <Pill>Paused</Pill>
      </div>
      {["Market Pulse Digest", "AI Earnings Radar", "GLP-1 Trial Watch", "space-rs-rotation"].map((item, index) => (
        <div className="alert-card" key={item}>
          <header>
            <strong>{item}</strong>
            <button type="button">Push-notify</button>
          </header>
          <small>{index === 0 ? "Mega Chin · Last Run 15m" : "Runs daily · Last Run 1h"}</small>
          <div className="alert-actions">
            <Edit3 size={15} />
            <Activity size={15} />
            <span>Unsubscribe</span>
          </div>
        </div>
      ))}
    </>
  );
}

function SettingsApi() {
  return (
    <>
      <SectionHeader action="+ Create" title="Alva API Keys" />
      {["Open Claw Key", "Claude Key", "Gemini Private Key"].map((item) => (
        <ApiKeyRow key={item} label={item} />
      ))}
      <SectionHeader action="Upload" title="Secrets Vault" />
      <ApiKeyRow label="Sheer Test" muted />
      <div className="quick-start">
        <KeyRound size={16} />
        <span>
          <strong>Quick Start</strong>
          <small>For full setup instructions, configuration details, and examples.</small>
        </span>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function Connection({ icon, label, sub, action }: { icon: string; label: string; sub: string; action: string }) {
  return (
    <div className="connection-row">
      <span className="connection-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{sub}</small>
      </span>
      <button type="button">{action}</button>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="notice">{children}</div>;
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="metric-card">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

function UsageBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="usage-bar">
      <span>
        <b>{label}</b>
        <small>{value}</small>
      </span>
      <div>
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, enabled = false }: { label: string; value?: string; enabled?: boolean }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      {value ? <strong>{value}</strong> : null}
      <button className={enabled ? "enabled" : ""} type="button" aria-label={label}>
        <span />
      </button>
    </div>
  );
}

function ApiKeyRow({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`api-row ${muted ? "muted" : ""}`}>
      <KeyRound size={16} />
      <span>
        <strong>{label}</strong>
        <small>eyJhbGciOiJ**************</small>
      </span>
      <Copy size={15} />
      <Edit3 size={15} />
    </div>
  );
}

function ChatSelectedPage({ onBack }: { onBack: () => void }) {
  return (
    <Page className="chat-page selected-chat">
      <TopBar
        title="Daily FinTwit Digest"
        left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />}
        right={<IconButton icon={MoreHorizontal} label="More" />}
      />
      <div className="chat-scroll">
        <div className="agent-label">
          <span className="agent-icon">
            <Bot size={18} />
          </span>
          <strong>Alva</strong>
        </div>
        <article className="digest-card">
          <p>Do you want this digest delivered automatically each morning?</p>
          <div className="option-grid">
            <button type="button">Telegram</button>
            <button type="button">Discord</button>
            <button type="button">WhatsApp</button>
          </div>
        </article>
        <div className="user-bubble small">Telegram delivery daily at 7:30 AM.</div>
        <article className="digest-card compact-card">
          <Check size={17} />
          <p>Done. I will send the Daily FinTwit Digest to Telegram every day at 7:30 AM.</p>
        </article>
      </div>
      <Composer />
    </Page>
  );
}

function ProfilePage({ onBack }: { onBack: () => void }) {
  return (
    <Page className="profile-page" scroll>
      <TopBar
        border={false}
        left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />}
        right={<IconButton icon={Share2} label="Share" />}
        title=""
      />
      <div className="profile-hero">
        <Avatar size={72} src={asset("assets/avatars/av-zet.jpeg")} />
        <h1>YGGYLL</h1>
        <p>@sheer · alva.ai/yggyll</p>
        <div className="profile-actions">
          <button type="button">Edit Profile</button>
          <button type="button">Share</button>
        </div>
      </div>
      <div className="stats-grid">
        <Stat value="6" label="Playbooks" />
        <Stat value="890" label="Stars" />
        <Stat value="12" label="Remix" />
        <Stat value="$1,203.45" label="Earned" />
      </div>
      <TabRow
        active="playbooks"
        items={[
          { id: "playbooks", label: "My Playbooks" },
          { id: "starred", label: "My starred" },
          { id: "purchased", label: "My purchased" },
        ]}
        onChange={() => undefined}
      />
      <div className="filter-row">
        <Pill active>All</Pill>
        <Pill>Public</Pill>
        <Pill>Private</Pill>
        <Pill>Paid</Pill>
      </div>
      {playbooks.slice(0, 4).map((item) => (
        <PlaybookRow item={item} key={item.title} />
      ))}
    </Page>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PlaybookDetailPage({
  tab,
  onBack,
  onInfo,
  onAsk,
  onTab,
}: {
  tab: DetailTab;
  onBack: () => void;
  onInfo: () => void;
  onAsk: () => void;
  onTab: (tab: DetailTab) => void;
}) {
  return (
    <Page className="detail-page" scroll>
      <TopBar
        left={<IconButton icon={ArrowLeft} label="Back" onClick={onBack} />}
        right={
          <>
            <IconButton icon={Info} label="Info" onClick={onInfo} />
            <IconButton icon={MoreHorizontal} label="More" />
          </>
        }
        title=""
      />
      <div className="detail-hero">
        <img alt="" src={asset("assets/covers/cover-roundtable.webp")} />
        <div>
          <h1>Quality Value Stock Screener</h1>
          <p>AI infrastructure investment thesis tracker across silicon, networking, hyperscalers, power, and data centers.</p>
          <div className="detail-tags">
            <Pill>Value</Pill>
            <Pill>Quality</Pill>
            <Pill>US Equities</Pill>
          </div>
        </div>
      </div>
      <div className="detail-stats">
        <Stat value="2.6K" label="Views" />
        <Stat value="24" label="Comments" />
        <Stat value="12" label="Remix" />
        <Stat value="138" label="Subscribed" />
      </div>
      <TabRow active={tab} items={detailTabs} onChange={onTab} />
      <DetailContent tab={tab} />
      <div className="detail-actions">
        <button onClick={onAsk} type="button">
          <Bot size={16} /> Ask Alva
        </button>
        <button type="button">Remix</button>
        <button type="button">Trade</button>
        <button className="filled" type="button">Subscribe</button>
      </div>
    </Page>
  );
}

function DetailContent({ tab }: { tab: DetailTab }) {
  if (tab === "analytics") {
    return (
      <div className="detail-content">
        <Panel title="Return Analysis">
          <MiniChart variant="bars" />
        </Panel>
        <Panel title="Risk Metrics">
          <MetricLine label="Sharpe" value="1.84" />
          <MetricLine label="Max Drawdown" value="-8.6%" />
          <MetricLine label="Volatility" value="12.3%" />
        </Panel>
      </div>
    );
  }
  if (tab === "strategy") {
    return (
      <div className="detail-content">
        <Panel title="Objective">
          <p>Screen for durable quality companies that remain statistically cheap relative to historical margins, cash flow, and peer multiples.</p>
        </Panel>
        <Panel title="Rules">
          <p>Rank candidates by quality score, value score, earnings revision, and risk-adjusted trend confirmation.</p>
        </Panel>
      </div>
    );
  }
  if (tab === "feed") {
    return (
      <div className="detail-content">
        {["NVDA margin pressure eased after supplier checks.", "Power-grid exposure improved across top holdings.", "Semis rotation remains active versus software."].map((item) => (
          <Panel key={item} title="Market update">
            <p>{item}</p>
            <small>Jun 15 · 9:30 AM</small>
          </Panel>
        ))}
      </div>
    );
  }
  return (
    <div className="detail-content">
      <Panel title="Creator">
        <div className="creator-row">
          <Avatar src={asset("assets/avatars/av-zet.jpeg")} />
          <span>
            <strong>YGGYLL</strong>
            <small>Value systems · 6 public playbooks</small>
          </span>
        </div>
      </Panel>
      <Panel title="Equity Curve">
        <MiniChart />
      </Panel>
      <Panel title="Return Snapshot">
        <MetricLine label="1M" value="+4.8%" />
        <MetricLine label="3M" value="+12.6%" />
        <MetricLine label="YTD" value="+18.9%" />
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniChart({ variant = "line" }: { variant?: "line" | "bars" }) {
  return (
    <div className={`mini-chart ${variant}`}>
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} style={{ height: `${22 + ((index * 17) % 58)}px` }} />
      ))}
    </div>
  );
}

function AskAlvaOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="ask-sheet">
        <div className="sheet-handle" />
        <TopBar
          border={false}
          left={<IconButton icon={X} label="Close" onClick={onClose} />}
          right={<IconButton icon={Plus} label="New chat" />}
          title="Ask Alva"
        />
        <div className="chat-scroll sheet-chat">
          <div className="agent-label">
            <span className="agent-icon">
              <Bot size={18} />
            </span>
            <strong>Alva</strong>
          </div>
          <article className="digest-card compact-card">
            <p>Ask me about this playbook, adjust rules, or create a trade plan from the current strategy.</p>
          </article>
        </div>
        <Composer compact />
      </div>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-root modal-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="info-modal">
        <header>
          <h2>Quality Value Stock Screener</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </header>
        <p>
          AI infrastructure investment thesis tracking across silicon, networking, hyperscalers, power, and data centers.
        </p>
        <div className="modal-stats">
          <Stat value="2.6K" label="Views" />
          <Stat value="24" label="Comments" />
          <Stat value="12" label="Remix" />
          <Stat value="138" label="Subscribed" />
        </div>
        <div className="detail-tags">
          <Pill>AI Infra</Pill>
          <Pill>Automation</Pill>
          <Pill>US Equities</Pill>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [history, setHistory] = useState<Screen[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const navigate = (next: Screen) => {
    setHistory((items) => [...items, screen]);
    setDirection("forward");
    setOverlay(null);
    setScreen(next);
  };

  const replace = (next: Screen) => {
    setHistory([]);
    setDirection("forward");
    setOverlay(null);
    setScreen(next);
  };

  const back = (fallback: Screen = "sidebar") => {
    setHistory((items) => {
      const stack = [...items];
      const previous = stack.pop() ?? fallback;
      setDirection("back");
      setOverlay(null);
      setScreen(previous);
      return stack;
    });
  };

  const openDetail = () => {
    setDetailTab("overview");
    navigate("playbookDetail");
  };

  const openSettings = () => {
    setSettingsTab("account");
    navigate("settings");
  };

  const rendered = useMemo(() => {
    switch (screen) {
      case "login":
        return <LoginPage onLogin={() => replace("chat")} />;
      case "chat":
        return <ChatPage onMenu={() => navigate("sidebar")} />;
      case "sidebar":
        return (
          <SidebarPage
            onAccount={() => navigate("sidebarMenu")}
            onChat={() => navigate("chatSelected")}
            onExplore={() => navigate("explore")}
            onPlaybook={openDetail}
            onPlaybooks={() => navigate("playbooks")}
            onRecentChats={() => navigate("recentChats")}
          />
        );
      case "sidebarMenu":
        return <SidebarMenuPage onBack={() => back("sidebar")} onProfile={() => navigate("profile")} onSettings={openSettings} />;
      case "playbooks":
        return <PlaybooksPage onBack={() => back("sidebar")} onOpen={openDetail} />;
      case "recentChats":
        return <RecentChatsPage onBack={() => back("sidebar")} onChat={() => navigate("chatSelected")} />;
      case "explore":
        return <ExplorePage onMenu={() => navigate("sidebar")} onOpen={openDetail} />;
      case "chatSelected":
        return <ChatSelectedPage onBack={() => back("sidebar")} />;
      case "profile":
        return <ProfilePage onBack={() => back("sidebar")} />;
      case "settings":
        return <SettingsPage active={settingsTab} onBack={() => back("sidebarMenu")} onTab={setSettingsTab} />;
      case "playbookDetail":
        return (
          <PlaybookDetailPage
            onAsk={() => setOverlay("askAlva")}
            onBack={() => back("sidebar")}
            onInfo={() => setOverlay("infoModal")}
            onTab={setDetailTab}
            tab={detailTab}
          />
        );
      default:
        return null;
    }
  }, [screen, settingsTab, detailTab]);

  return (
    <main className="demo-root">
      <section className="desktop-gate" aria-label="Desktop unavailable">
        <p>此 demo 仅在移动端窗口尺寸生效</p>
      </section>

      <section className="mobile-shell" aria-label="m.baby mobile demo">
        <div className={`view-transition enter-${direction}`} key={screen}>
          {rendered}
        </div>
        {overlay === "askAlva" ? <AskAlvaOverlay onClose={() => setOverlay(null)} /> : null}
        {overlay === "infoModal" ? <InfoModal onClose={() => setOverlay(null)} /> : null}
      </section>
    </main>
  );
}
