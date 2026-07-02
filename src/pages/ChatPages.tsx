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
  blocks?: AssistantReplyBlock[];
  id: number;
  role: "user" | "assistant";
  content: string;
  status?: "thinking" | "complete";
};

type AssistantReplyBlock =
  | { text: string; type: "paragraph" }
  | { items: string[]; type: "bullets" }
  | { label: string; text: string; type: "callout" }
  | { items: string[]; type: "actions" };

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeUserSnippet(message: string) {
  const normalizedMessage = message.trim().replace(/\s+/g, " ");
  return normalizedMessage.length > 52 ? `${normalizedMessage.slice(0, 49)}...` : normalizedMessage;
}

function createAssistantReplyBlocks(message: string, turnIndex: number): AssistantReplyBlock[] {
  const shortMessage = normalizeUserSnippet(message);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("report") || lowerMessage.includes("full")) {
    return randomItem<AssistantReplyBlock[]>([
      [
        { text: "I would open the full report when you need source confidence, not just a quick ticker answer.", type: "paragraph" },
        {
          items: ["theme strength", "which authors repeated the call", "whether price confirmed after the posts"],
          type: "bullets",
        },
        { label: "Read first", text: "Start from the theme layer, then drill into the ticker table only if the author cluster is broad enough.", type: "callout" },
      ],
      [
        { label: "Short answer", text: "Yes. The report is the better surface here because it preserves the sequence of signals.", type: "callout" },
        { text: "The quick chat answer can summarize NVDA or AVGO, but the report lets you see whether the idea kept earning confirmation over time.", type: "paragraph" },
      ],
    ]);
  }

  if (lowerMessage.includes("telegram") || lowerMessage.includes("alert")) {
    return randomItem<AssistantReplyBlock[]>([
      [
        { text: "I would keep Telegram quiet by default and only send a push when the signal changes meaningfully.", type: "paragraph" },
        {
          items: ["ticker breaks above yesterday's attention baseline", "sentiment flips fast", "two or more independent author clusters agree"],
          type: "bullets",
        },
      ],
      [
        { label: "Alert rule", text: "Send a digest daily; escalate intraday only on conviction breaks.", type: "callout" },
        { items: ["mention the ticker", "name the source cluster", "state what changed from the last digest"], type: "actions" },
      ],
    ]);
  }

  const variants: AssistantReplyBlock[][] = [
    [
      { text: `I am reading "${shortMessage}" as a follow-up to the current FinTwit digest.`, type: "paragraph" },
      { text: "The next useful check is whether attention is broad-based or coming from one loud cluster.", type: "paragraph" },
      { items: ["ticker momentum", "author conviction", "later-post confirmation"], type: "actions" },
    ],
    [
      { label: "Signal quality", text: "I would not answer this in isolation yet.", type: "callout" },
      {
        items: ["first, look for repeated independent mentions", "then compare price confirmation", "finally separate action-now from watchlist"],
        type: "bullets",
      },
    ],
    [
      { text: `For "${shortMessage}", I would treat the current digest as context rather than a final answer.`, type: "paragraph" },
      { text: "If the same authors repeat the call and price confirms, it becomes more actionable. If attention fades, keep it on watch.", type: "paragraph" },
    ],
    [
      { text: "Quick take: this is mostly about signal quality.", type: "paragraph" },
      { label: "What I would check", text: "Breadth of mentions first, price reaction second, author track record third.", type: "callout" },
    ],
  ];

  return variants[turnIndex % variants.length];
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
          item.id === assistantId ? { ...item, blocks: createAssistantReplyBlocks(message, Math.floor(userId / 2)), content: "", status: "complete" } : item,
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

function AssistantReply({ blocks, content }: { blocks?: AssistantReplyBlock[]; content: string }) {
  if (!blocks || blocks.length === 0) {
    return <p>{content}</p>;
  }

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={index}>{block.text}</p>;
        }

        if (block.type === "callout") {
          return (
            <div className="assistant-callout" key={index}>
              <strong>{block.label}</strong>
              <span>{block.text}</span>
            </div>
          );
        }

        return (
          <ul className={`assistant-list assistant-list-${block.type}`} key={index}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      })}
    </>
  );
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
                <AssistantReply blocks={message.blocks} content={message.content} />
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
