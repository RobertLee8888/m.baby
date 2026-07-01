import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AgentIcon,
  AssetIcon,
  Composer,
  IconButton,
  Page,
  Pill,
  TopBar,
  TabRow,
} from "../components";

const CHAT_CONTENT_LOADING_MS = 2200;
const AI_THINKING_MS = 1400;

type LiveChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "complete";
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createAssistantReply(message: string) {
  const normalizedMessage = message.trim().replace(/\s+/g, " ");
  const lowerMessage = normalizedMessage.toLowerCase();
  const shortMessage = normalizedMessage.length > 96 ? `${normalizedMessage.slice(0, 93)}...` : normalizedMessage;

  if (lowerMessage.includes("report") || lowerMessage.includes("full")) {
    return `${randomItem([
      "The full report is useful here because the strongest signal is the cluster, not any single mention.",
      "I would read the report from the theme layer first, then drill into ticker-level confirmation.",
      "The main thing to watch is whether the report keeps repeating the same names across independent FinTwit sources.",
    ])} ${randomItem([
      "Right now NVDA still leads the attention stack, while AVGO is showing up more like a hedge or funding short.",
      "If NVDA volume and author conviction both fade, I would treat the setup as lower quality even if mentions stay high.",
      "The cleaner follow-up is to compare sentiment shifts against price action before turning this into an alert.",
    ])}`;
  }

  if (lowerMessage.includes("telegram") || lowerMessage.includes("alert")) {
    return `${randomItem([
      "For alerts, I would keep the default cadence calm and only interrupt when the signal actually changes.",
      "A daily Telegram digest makes sense, but intraday pushes should be reserved for conviction breaks.",
      "I would avoid noisy alerts here and use a tighter rule around sentiment change plus ticker concentration.",
    ])} ${randomItem([
      "A good trigger would be NVDA or BTC moving far away from its prior-day FinTwit baseline.",
      "The alert should mention the ticker, the source cluster, and why this is different from the last digest.",
      "If the same authors repeat the call and price confirms, then it is worth escalating.",
    ])}`;
  }

  return `${randomItem([
    `I will treat "${shortMessage}" as a follow-up on the current digest context.`,
    `Good question. I would connect "${shortMessage}" back to the digest instead of answering it in isolation.`,
    `Using the current FinTwit context, "${shortMessage}" is mostly about signal quality.`,
  ])} ${randomItem([
    "The useful next step is to compare ticker momentum, author conviction, and whether later posts confirm the setup.",
    "I would look for repeated independent mentions first, then check whether the price action is confirming or diverging.",
    "The answer changes if the attention is broad-based versus coming from one loud cluster of accounts.",
    "I would separate what is actionable now from what should stay on watch until there is a cleaner confirmation.",
  ])}`;
}

function useLiveChat() {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const nextIdRef = useRef(1);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendMessage = (message: string) => {
    if (isThinking) return;

    const userId = nextIdRef.current;
    const assistantId = userId + 1;
    nextIdRef.current += 2;
    setIsThinking(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { content: message, id: userId, role: "user" },
      { content: "", id: assistantId, role: "assistant", status: "thinking" },
    ]);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setMessages((currentMessages) =>
        currentMessages.map((item) =>
          item.id === assistantId ? { ...item, content: createAssistantReply(message), status: "complete" } : item,
        ),
      );
      setIsThinking(false);
      timeoutRef.current = null;
    }, AI_THINKING_MS);
  };

  return { isThinking, messages, sendMessage };
}

function useChatAutoScroll(messages: LiveChatMessage[]) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = window.setTimeout(() => {
      const scrollArea = scrollRef.current;
      scrollArea?.scrollTo({ behavior: "smooth", top: scrollArea.scrollHeight });
    }, 40);

    return () => window.clearTimeout(timeout);
  }, [messages]);

  return scrollRef;
}

function LiveChatTail({ messages }: { messages: LiveChatMessage[] }) {
  if (messages.length === 0) return null;

  return (
    <div aria-live="polite" className="live-chat-tail">
      {messages.map((message) =>
        message.role === "user" ? (
          <div className="live-chat-turn live-chat-turn-user" key={message.id}>
            <div className="user-bubble live-user-bubble">{message.content}</div>
          </div>
        ) : (
          <div className="live-chat-turn live-chat-turn-assistant" key={message.id}>
            <div className="agent-label live-agent-label">
              <AgentIcon />
              <strong>Alva</strong>
            </div>
            {message.status === "thinking" ? (
              <div className="assistant-thinking">
                <span>Thinking</span>
                <span className="typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ) : (
              <div className="assistant-message assistant-message-live">
                <p>{message.content}</p>
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}

function useFakeContentLoading() {
  const [loading, setLoading] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    setLoading(true);
    const timeout = window.setTimeout(() => setLoading(false), CHAT_CONTENT_LOADING_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  return loading;
}

function ChatContentLoader({ children, variant }: { children: ReactNode; variant: "agent" | "thread" }) {
  const loading = useFakeContentLoading();

  return (
    <div aria-busy={loading} className={`chat-content-stage ${loading ? "is-loading" : "is-ready"}`}>
      {loading ? <ChatLoadingState variant={variant} /> : children}
    </div>
  );
}

function ChatLoadingState({ variant }: { variant: "agent" | "thread" }) {
  return (
    <div aria-hidden="true" className={`chat-loading chat-loading-${variant}`}>
      <div className="loading-agent-row">
        <AgentIcon />
        <strong>Alva</strong>
      </div>
      <div className="assistant-thinking initial-thinking">
        <span>{variant === "agent" ? "Preparing a fresh answer" : "Loading conversation"}</span>
        <span className="typing-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

export function ChatPage({ onMenu }: { onMenu: () => void }) {
  const { isThinking, messages, sendMessage } = useLiveChat();
  const scrollRef = useChatAutoScroll(messages);

  return (
    <Page className="chat-page">
      <TopBar
        border={false}
        title="Alva Agent"
        left={<IconButton className="chat-menu-button" iconSrc="assets/figma/menu-l2.svg" label="Open sidebar" onClick={onMenu} />}
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
      <div className="chat-scroll" ref={scrollRef}>
        <ChatContentLoader variant="agent">
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
              <p>Most calls still need confirmation from price action, volume, and follow-up posts before they become high-conviction trade ideas.</p>
              <p>
                The strongest current theme is AI infrastructure and cloud names, with $NVDA receiving repeated attention while $AVGO appears as a possible
                funding short.
              </p>
              <p>Most calls still need confirmation from price action, volume, and follow-up posts before they become high-conviction trade ideas.</p>
              <p>
                The strongest current theme is AI infrastructure and cloud names, with $NVDA receiving repeated attention while $AVGO appears as a possible
                funding short.
              </p>
            </div>
          </article>
          <section className="delivery-card" aria-label="Alert destinations">
            <div>
              <h2>Where should Alva send alerts?</h2>
              <p>Connect one destination first. Once connected, send yourself this sample digest to complete setup.</p>
            </div>
            <div className="delivery-actions">
              <button className="delivery-telegram" type="button">
                <AssetIcon size={14} src="assets/figma/account-telegram-l.svg" />
                Telegram
              </button>
              <button className="delivery-discord" type="button">
                <AssetIcon size={14} src="assets/figma/account-discord-l.svg" />
                Discord
              </button>
              <button className="delivery-whatsapp" type="button">
                <AssetIcon size={14} src="assets/figma/account-whatsapp-l.svg" />
                WhatsApp
              </button>
            </div>
          </section>
          <LiveChatTail messages={messages} />
        </ChatContentLoader>
      </div>
      <Composer disabled={isThinking} onSend={sendMessage} />
    </Page>
  );
}

export function ChatSelectedPage({ onBack }: { onBack: () => void }) {
  const { isThinking, messages, sendMessage } = useLiveChat();
  const scrollRef = useChatAutoScroll(messages);

  return (
    <Page className="chat-page selected-chat">
      <TopBar
        title={
          <span className="title-with-caret">
            Daily FinTwit Digest <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
          </span>
        }
        left={<IconButton iconSrc="assets/figma/back-l1.svg" label="Back" onClick={onBack} />}
        right={<IconButton iconSrc="assets/figma/account-settings-l.svg" label="Settings" />}
      />
      <div className="chat-scroll" ref={scrollRef}>
        <ChatContentLoader variant="thread">
          <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
          <div className="agent-label">
            <AgentIcon />
            <strong>Alva</strong>
            <time>10:28 PM</time>
          </div>
          <div className="assistant-message">
            <p>
              On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and
              sentiment shifts.
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
          <LiveChatTail messages={messages} />
        </ChatContentLoader>
      </div>
      <Composer disabled={isThinking} onSend={sendMessage} />
    </Page>
  );
}

export function AskAlvaOverlay({ onClose }: { onClose: () => void }) {
  const { isThinking, messages, sendMessage } = useLiveChat();
  const scrollRef = useChatAutoScroll(messages);

  return (
    <div className="overlay-root ask-overlay-root">
      <button className="overlay-backdrop" onClick={onClose} type="button" aria-label="Close" />
      <div className="ask-sheet">
        <div className="sheet-handle" />
        <TopBar
          border={false}
          left={<IconButton iconSrc="assets/figma/close-l2.svg" label="Close" onClick={onClose} />}
          right={
            <>
              <IconButton iconSrc="assets/figma/chat-new-overlay-l.svg" label="New chat" />
              <IconButton iconSrc="assets/figma/unfoldd-l.svg" label="Expand" />
            </>
          }
          title={
            <span className="title-with-caret">
              Daily FinTwit Digest <AssetIcon size={12} src="assets/figma/profile-arrow-down-l2.svg" />
            </span>
          }
        />
        <div className="chat-scroll sheet-chat" ref={scrollRef}>
          <ChatContentLoader variant="thread">
            <div className="user-bubble">Create today's FinTwit Digest from my chosen FinTwit list.</div>
            <div className="agent-label">
              <AgentIcon />
              <strong>Alva</strong>
              <time>10:28 PM</time>
            </div>
            <div className="assistant-message">
              <p>
                On it. I'll read today's posts from your 8 selected FinTwit accounts and condense them into one digest — top calls, ticker mentions, and
                sentiment shifts.
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
            <LiveChatTail messages={messages} />
          </ChatContentLoader>
        </div>
        <Composer compact disabled={isThinking} onSend={sendMessage} />
      </div>
    </div>
  );
}
