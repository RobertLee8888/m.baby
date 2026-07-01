import type { ReactNode } from "react";
import { asset } from "./assets";
import type { ChatItem, Playbook } from "./types";

export function AssetIcon({ className = "", size = 20, src }: { className?: string; size?: number; src: string }) {
  return <img alt="" className={`asset-icon ${className}`} height={size} src={asset(src)} style={{ height: size, width: size }} width={size} />;
}

export function IconButton({
  label,
  iconSrc,
  onClick,
  className = "",
}: {
  label: string;
  iconSrc?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button aria-label={label} className={`icon-button ${className}`} onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : null}
    </button>
  );
}

export function Page({ children, className = "", scroll = false }: { children: ReactNode; className?: string; scroll?: boolean }) {
  return <div className={`page ${scroll ? "page-scroll" : ""} ${className}`}>{children}</div>;
}

export function Logo({ size = "large" }: { size?: "large" | "small" }) {
  return (
    <div className={`logo-mark logo-${size}`} aria-label="Alva">
      <img className="logo-symbol" src={asset("assets/figma/alva-symbol.svg")} alt="" />
      <img className="logo-word" src={asset("assets/figma/alva-word.svg")} alt="" />
    </div>
  );
}

export function TopBar({ title, left, right, border = true }: { title: ReactNode; left?: ReactNode; right?: ReactNode; border?: boolean }) {
  return (
    <div className={`topbar ${border ? "topbar-border" : ""}`}>
      <div className="topbar-side">{left}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-right">{right}</div>
    </div>
  );
}

export function TabRow<T extends string>({
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
        <button className={`tab-item ${active === item.id ? "active" : ""}`} key={item.id} onClick={() => onChange(item.id)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <span className={`pill ${active ? "pill-active" : ""}`}>{children}</span>;
}

export function Avatar({ src, size = 36 }: { src: string; size?: number }) {
  return <img alt="" className="avatar" height={size} src={src} style={{ height: size, width: size }} width={size} />;
}

export function AgentIcon() {
  return (
    <span className="agent-icon">
      <img alt="" src={asset("assets/figma/alva-agent-icon.svg")} />
    </span>
  );
}

export function NavRow({
  iconSrc,
  label,
  active = false,
  onClick,
  badge,
}: {
  iconSrc?: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button className={`nav-row ${active ? "active" : ""}`} onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : null}
      <span>{label}</span>
      {badge ? <span className="mini-badge">{badge}</span> : null}
    </button>
  );
}

export function PlaybookRow({ item, onClick }: { item: Playbook; onClick?: () => void }) {
  return (
    <button className="playbook-row" onClick={onClick} type="button">
      <Avatar size={32} src={item.avatar} />
      <span className="row-copy">
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>
      </span>
    </button>
  );
}

export function ChatRow({ item, onClick }: { item: ChatItem; onClick?: () => void }) {
  return (
    <button className="chat-row" onClick={onClick} type="button">
      <AssetIcon src="assets/figma/sidebar-thread-normal.svg" />
      <span>{item.title}</span>
      <time>{item.time}</time>
    </button>
  );
}

export function Composer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`composer ${compact ? "composer-compact" : ""}`}>
      <AssetIcon className="composer-plus" size={16} src="assets/figma/add-l2.svg" />
      <span>Ask Alva anything. @ for context, / for skills</span>
      <button type="button">
        <AssetIcon size={14} src="assets/figma/arrow-up-l1-chat.svg" />
      </button>
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
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

export function MenuItem({
  iconSrc,
  label,
  onClick,
  status = false,
}: {
  iconSrc?: string;
  label: string;
  onClick?: () => void;
  status?: boolean;
}) {
  return (
    <button className="menu-item" onClick={onClick} type="button">
      {iconSrc ? <AssetIcon src={iconSrc} /> : null}
      <span>{label}</span>
      {status ? <span className="status-dot" /> : null}
      <AssetIcon size={12} src="assets/figma/arrow-right-l2.svg" />
    </button>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

export function Connection({ icon, iconSrc, label, sub, action }: { icon?: string; iconSrc?: string; label: string; sub: string; action: string }) {
  return (
    <div className="connection-row">
      <span className={`connection-icon ${iconSrc ? "connection-icon-image" : ""}`}>{iconSrc ? <AssetIcon size={20} src={iconSrc} /> : icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{sub}</small>
      </span>
      <button className={action === "Login Account" ? "muted-action" : ""} type="button">
        {action}
      </button>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}

export function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="metric-card">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}

export function UsageBar({ label, value, percent }: { label: string; value: string; percent: number }) {
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

export function ToggleRow({ label, value, enabled = false }: { label: string; value?: string; enabled?: boolean }) {
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

export function ApiKeyRow({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`api-row ${muted ? "muted" : ""}`}>
      <AssetIcon size={16} src="assets/figma/key-l1.svg" />
      <span>
        <strong>{label}</strong>
        <small>eyJhbGciOiJ**************</small>
      </span>
      <AssetIcon size={15} src="assets/figma/copy-l1.svg" />
      <AssetIcon size={15} src="assets/figma/profile-edit-l1.svg" />
    </div>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MiniChart({ variant = "line" }: { variant?: "line" | "bars" }) {
  return (
    <div className={`mini-chart ${variant}`}>
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} style={{ height: `${22 + ((index * 17) % 58)}px` }} />
      ))}
    </div>
  );
}
