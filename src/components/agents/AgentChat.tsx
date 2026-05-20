"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Trash2, Loader2 } from "lucide-react";
import ToolCallDisplay from "./ToolCallDisplay";

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolCallBlock {
  type: "tool_call";
  name: string;
  input: Record<string, unknown>;
  result?: string;
}

type Block = TextBlock | ToolCallBlock;

interface Message {
  role: "user" | "assistant";
  blocks: Block[];
}

interface AgentChatProps {
  agentId: string;
  agentName: string;
  agentColor: string; // CSS color value
  description: string;
  quickActions: string[];
  icon: React.ReactNode;
}

function renderBlocks(blocks: Block[]) {
  return blocks.map((block, i) => {
    if (block.type === "text") {
      return (
        <span key={i} style={{ whiteSpace: "pre-wrap" }}>
          {block.text}
        </span>
      );
    }
    return (
      <ToolCallDisplay
        key={i}
        name={block.name}
        input={block.input}
        result={block.result}
      />
    );
  });
}

export default function AgentChat({
  agentId,
  agentName,
  agentColor,
  description,
  quickActions,
  icon,
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" }).catch(() => null);
  }, [agentId]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || streaming) return;
      setInput("");

      const userMsg: Message = { role: "user", blocks: [{ type: "text", text: msg }] };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setStreaming(true);

      // Build history in the format the backend expects
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.blocks
          .filter((b) => b.type === "text")
          .map((b) => (b as TextBlock).text)
          .join(""),
      }));

      const assistantBlocks: Block[] = [];
      const assistantMsg: Message = { role: "assistant", blocks: assistantBlocks };

      // Append placeholder immediately so user sees it streaming
      setMessages((prev) => [...prev, assistantMsg]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch(`/api/agents/${agentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.startsWith("data: ") ? part.slice(6) : part;
            if (!line || line === "[DONE]") continue;
            try {
              const event = JSON.parse(line) as {
                type: string;
                data?: string;
                name?: string;
                input?: Record<string, unknown>;
                result?: string;
              };

              if (event.type === "text" && event.data) {
                const last = assistantBlocks[assistantBlocks.length - 1];
                if (last?.type === "text") {
                  last.text += event.data;
                } else {
                  assistantBlocks.push({ type: "text", text: event.data });
                }
              } else if (event.type === "tool_call" && event.name) {
                assistantBlocks.push({
                  type: "tool_call",
                  name: event.name,
                  input: event.input ?? {},
                });
              } else if (event.type === "tool_result") {
                const tc = [...assistantBlocks].reverse().find((b) => b.type === "tool_call") as ToolCallBlock | undefined;
                if (tc) tc.result = event.data;
              }

              // Force re-render by spreading the array
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", blocks: [...assistantBlocks] };
                return copy;
              });
            } catch {
              // malformed SSE chunk, skip
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        assistantBlocks.push({ type: "text", text: "Network error. Check that the marketing-agents backend is running on port 8001." });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", blocks: [...assistantBlocks] };
          return copy;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [agentId, input, messages, streaming]
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
      {/* Chat panel */}
      <div className="db-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="chat-messages" style={{ flex: 1 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", margin: "auto", padding: 40 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: agentColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                {icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{agentName}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>{description}</div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "chat-msg-user" : "chat-msg-ai"}
              style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
            >
              {m.role === "assistant" && (
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: agentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 2,
                }}>
                  <div style={{ transform: "scale(0.65)" }}>{icon}</div>
                </div>
              )}
              <div className={`chat-bubble ${m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
                style={{ flex: 1 }}>
                {renderBlocks(m.blocks)}
              </div>
              {m.role === "user" && (
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 2,
                }}>
                  <User size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
            </div>
          ))}

          {streaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: agentColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} style={{ color: "#fff" }} />
              </div>
              <div className="chat-bubble chat-bubble-ai">
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <input
            className="db-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${agentName}…`}
            disabled={streaming}
          />
          <button
            className="btn-primary"
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
          >
            {streaming ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
          </button>
        </div>
      </div>

      {/* Sidebar: quick actions + clear */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="db-card">
          <div className="db-card-title">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {quickActions.map((action) => (
              <button
                key={action}
                className="btn-ghost"
                style={{ textAlign: "left", whiteSpace: "normal", lineHeight: 1.4, fontSize: 12, padding: "8px 12px" }}
                onClick={() => sendMessage(action)}
                disabled={streaming}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {messages.length > 0 && (
          <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }} onClick={clearHistory}>
            <Trash2 size={13} /> Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
