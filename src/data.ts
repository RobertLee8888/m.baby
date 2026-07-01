import { asset } from "./assets";
import type { ChatItem, DetailTab, ExploreItem, Playbook, SettingsTab } from "./types";

export const playbooks: Playbook[] = [
  {
    title: "Investor Roundtable",
    subtitle: "Ten legendary investors debate any stock - live verdict",
    avatar: asset("assets/figma/sidebar-playbook-1.png"),
    cover: asset("assets/covers/cover-roundtable.webp"),
    tag: "Debate",
    stat: "2.6K",
  },
  {
    title: "LAB Short War Room",
    subtitle: "Live short-seller console for LABUSDT - squeeze risk",
    avatar: asset("assets/figma/sidebar-playbook-2.png"),
    cover: asset("assets/covers/cover-lab.webp"),
    tag: "Crypto",
    stat: "1.8K",
  },
  {
    title: "Citrini Operating System",
    subtitle: "Six modules - live macro indicators + megatrend tracker",
    avatar: asset("assets/figma/sidebar-playbook-3.png"),
    cover: asset("assets/covers/cover-citrini.webp"),
    tag: "Macro",
    stat: "9.1K",
  },
  {
    title: "Theme Tracker - Humanoid Robots",
    subtitle: "75 names across 9 supply-chain layers, scored daily",
    avatar: asset("assets/figma/sidebar-playbook-4.png"),
    cover: asset("assets/covers/cover-btcprice.webp"),
    tag: "Theme",
    stat: "3.2K",
  },
  {
    title: "BTC Bet Scanner",
    subtitle: "Polymarket BTC daily-close - 4-way probability blend",
    avatar: asset("assets/figma/sidebar-playbook-5.png"),
    cover: asset("assets/covers/cover-btcbet.webp"),
    tag: "Polymarket",
    stat: "5.7K",
  },
];

export const chats: ChatItem[] = [
  { title: "Crypto Price + AI Trend Pulse", time: "2 min ago" },
  { title: "$AVGO earnings recap", time: "26 min ago" },
  { title: "Macro & rates this week", time: "1 hour ago" },
  { title: "Semis vs power-grid rotation", time: "4 hours ago" },
  { title: "NVDA options flow check", time: "Yesterday" },
  { title: "AI infra shipment watch", time: "Tue" },
  { title: "FOMC liquidity map", time: "Mon" },
];

export const exploreItems: ExploreItem[] = [
  {
    title: "BTC Ultimate AI Trader",
    desc: "Aggregates real-time data across multiple DEX platforms to identify high-potential Gold...",
    author: "Alva Intern",
    avatar: asset("assets/avatars/ava-1.png"),
    cover: asset("assets/figma/explore-thumb-1.png"),
    price: "$50",
  },
  {
    title: "MAG7 Equal-Weight Monthly Rebalance",
    desc: "Maintains a fully invested equal-weight portfolio of the Magnificent 7 stocks and reb...",
    author: "Maya Reynolds",
    avatar: asset("assets/avatars/ava-2.png"),
    cover: asset("assets/figma/explore-thumb-2.png"),
  },
  {
    title: "PEPE Long vs BTC Short Monthly Rebal...",
    desc: "The OI Abnormal Movement Monitoring Strategy tracks selected crypto tokens on a...",
    author: "Lucas Bennett",
    avatar: asset("assets/avatars/ava-3.png"),
    cover: asset("assets/figma/explore-thumb-3.png"),
  },
  {
    title: "Attribution Analysis Strategy for Price...",
    desc: "Monitor selected tokens on a 4-hour timeframe to detect abnormal changes in Op...",
    author: "Olivia Hayes",
    avatar: asset("assets/avatars/ava-5.png"),
    cover: asset("assets/figma/explore-thumb-4.png"),
    price: "$5/mo",
  },
  {
    title: "BTC MACD 1h Simple Crossover",
    desc: "Trade BTC using MACD(12,26,9) line crossing with a simple risk filter.",
    author: "Ethan Brooks",
    avatar: asset("assets/avatars/av-zet.jpeg"),
    cover: asset("assets/covers/cover-btcprice.webp"),
  },
];

export const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Account" },
  { id: "usage", label: "Usage" },
  { id: "portfolio", label: "Portfolio" },
  { id: "alvaAgent", label: "Alva Agent" },
  { id: "alerts", label: "Automations" },
  { id: "apiKey", label: "API Key" },
];

export const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "strategy", label: "Strategy" },
  { id: "feed", label: "Feed" },
];
