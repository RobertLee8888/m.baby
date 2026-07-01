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

function createAssistantReply(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("report") || lowerMessage.includes("full")) {
    return "I can use the full report context here. The strongest thread is still AI infrastructure, with NVDA leading attention and AVGO showing up as the most useful hedge to watch.";
  }

  if (lowerMessage.includes("telegram") || lowerMessage.includes("alert")) {
    return "Got it. I would keep this digest on a morning alert cadence, then only escalate intraday when NVDA or BTC sentiment moves far enough away from the prior day baseline.";
  }

  return `Got it. I will answer using the current digest context: ${message}. The useful next step is to compare ticker momentum, author conviction, and whether the latest posts confirm or weaken the setup.`;
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
      <div className="loading-user-bubble skeleton-surface" />
      <div className="loading-answer-block">
        <div className="loading-agent-row">
          <AgentIcon />
          <span className="loading-agent-name skeleton-surface" />
          <span className="typing-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        {variant === "agent" ? (
          <div className="loading-card skeleton-card">
            <div className="loading-card-header">
              <span className="skeleton-line skeleton-title" />
              <span className="skeleton-pill" />
              <span className="skeleton-line skeleton-meta" />
            </div>
            <div className="loading-card-body">
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-wide" />
              <span className="skeleton-line skeleton-short" />
            </div>
          </div>
        ) : (
          <div className="loading-message-lines loading-message-lines-first">
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-wide" />
            <span className="skeleton-line skeleton-short" />
          </div>
        )}
      </div>
      {variant === "thread" ? (
        <div className="loading-thread-tail">
          <div className="loading-user-bubble loading-user-bubble-short skeleton-surface" />
          <div className="loading-agent-row">
            <AgentIcon />
            <span className="loading-agent-name skeleton-surface" />
          </div>
          <div className="loading-message-lines">
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-wide" />
            <span className="skeleton-line skeleton-short" />
          </div>
        </div>
      ) : (
        <div className="loading-delivery-card skeleton-card">
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line skeleton-wide" />
          <div className="loading-chip-row">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
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
