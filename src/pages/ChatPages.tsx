import {
  AgentIcon,
  AssetIcon,
  Composer,
  IconButton,
  Page,
  Pill,
  TopAd,
  TopBar,
  TabRow,
} from "../components";

export function ChatPage({ onMenu }: { onMenu: () => void }) {
  return (
    <Page className="chat-page">
      <TopAd />
      <TopBar
        title="Alva Agent"
        left={<IconButton iconSrc="assets/figma/menu-l1.svg" label="Open sidebar" onClick={onMenu} />}
        right={<IconButton iconSrc="assets/figma/account-settings-l.svg" label="Settings" />}
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
          <AgentIcon />
          <strong>Alva</strong>
        </div>
        <article className="digest-card">
          <header>
            <div>
              <h2>Daily Digest · Market Digest</h2>
              <Pill>
                <span className="teal-dot" /> nvda-macd-hft-notify
              </Pill>
              <p className="muted">English · Jun 15 · Daily Digest · Previous day · Based on 53 FinTwits</p>
            </div>
            <button type="button">Open full report</button>
          </header>
          <div className="digest-body">
            <p>Top-ranked traders clustered around $NVDA, $000660.KS, $AKAM, $AMPG, and $AVGO in this window.</p>
            <p>
              The strongest current theme is AI infrastructure and cloud names, with $NVDA receiving repeated attention while $AVGO appears as a possible
              funding short.
            </p>
          </div>
        </article>
      </div>
      <Composer />
    </Page>
  );
}

export function ChatSelectedPage({ onBack }: { onBack: () => void }) {
  return (
    <Page className="chat-page selected-chat">
      <TopAd />
      <TopBar
        title={
          <span className="title-with-caret">
            Daily FinTwit Digest <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
          </span>
        }
        left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />}
        right={<IconButton iconSrc="assets/figma/account-settings-l.svg" label="Settings" />}
      />
      <div className="chat-scroll">
        <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
        <div className="agent-label">
          <AgentIcon />
          <strong>Alva</strong>
          <time>10:28 PM</time>
        </div>
        <div className="assistant-message">
          <p>
            On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and sentiment
            shifts.
          </p>
          <p>Want me to deliver this automatically each morning?</p>
        </div>
        <div className="user-bubble selected-confirm">Yes — send it to Telegram daily at 7:30 AM.</div>
        <div className="agent-label">
          <AgentIcon />
          <strong>Alva</strong>
          <time>10:28 PM</time>
        </div>
        <div className="assistant-message">
          <p>Done. Your FinTwit Digest is scheduled for 7:30 AM daily and will arrive in Telegram.</p>
          <p>Today's edition: 8 accounts covered, 14 tickers flagged — NVDA and BTC drew the most bullish mentions.</p>
          <p>Highlights: NVDA bulls at 68%, BTC reclaiming $104k, and</p>
        </div>
      </div>
      <Composer />
    </Page>
  );
}

export function AskAlvaOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-root ask-overlay-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="ask-sheet">
        <div className="sheet-handle" />
        <TopBar
          border={false}
          left={<IconButton iconSrc="assets/figma/close-l1.svg" label="Close" onClick={onClose} />}
          right={
            <>
              <IconButton iconSrc="assets/figma/chat-new-l.svg" label="New chat" />
              <IconButton iconSrc="assets/figma/expand-l1.svg" label="Expand" />
            </>
          }
          title={
            <span className="title-with-caret">
              Daily FinTwit Digest <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
            </span>
          }
        />
        <div className="chat-scroll sheet-chat">
          <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
          <div className="agent-label">
            <AgentIcon />
            <strong>Alva</strong>
            <time>10:28 PM</time>
          </div>
          <div className="assistant-message">
            <p>
              On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and sentiment
              shifts.
            </p>
            <p>Want me to deliver this automatically each morning?</p>
          </div>
          <div className="user-bubble selected-confirm">Yes — send it to Telegram daily at 7:30 AM.</div>
          <div className="agent-label">
            <AgentIcon />
            <strong>Alva</strong>
            <time>10:28 PM</time>
          </div>
          <div className="assistant-message">
            <p>Done. Your FinTwit Digest is scheduled for 7:30 AM daily and will arrive in Telegram.</p>
            <p>Today's edition: 8 accounts covered, 14 tickers flagged — NVDA and BTC drew the most bullish mentions.</p>
          </div>
        </div>
        <Composer compact />
      </div>
    </div>
  );
}
