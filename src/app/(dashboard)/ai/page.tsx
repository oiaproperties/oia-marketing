"use client";
import { useState, useRef, useEffect } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import Spinner from "@/components/ui/Spinner";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  "Analyze my Google campaigns and give CRITICAL recommendations",
  "Review my Meta Ads performance and suggest budget reallocation",
  "Suggest 10 Arabic keywords for Aldar Yas Acres targeting UAE nationals",
  "Create a 30-day optimization roadmap for OIA Dubai campaigns",
  "What negative keywords should I add to prevent wasted spend?",
  "Compare performance between Google and Meta and recommend focus",
];

export default function AIPage() {
  const { google, meta, isGoogleConnected, isMetaConnected } = useCredentialsStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg) return;
    setInput("");

    const updated: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setLoading(true);

    const accountContext = {
      googleConnected:  isGoogleConnected,
      metaConnected:    isMetaConnected,
      googleCustomerId: google?.customer_id ?? null,
      metaAccountId:    meta?.ad_account_id ?? null,
      client:           "OIA Dubai — Aldar Real Estate",
    };

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          accountContext,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages([...updated, { role: "assistant", content: json.data?.text ?? "No response" }]);
      } else {
        setMessages([...updated, { role: "assistant", content: `Error: ${json.error}` }]);
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Network error. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">AI Assistant</h1>
          <p className="db-page-sub">Claude-powered ads expert for OIA Dubai campaigns</p>
        </div>
        {messages.length > 0 && (
          <button className="btn-ghost" onClick={() => setMessages([])}>Clear Chat</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        {/* Chat */}
        <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: "center", margin: "auto", padding: 40 }}>
                <Bot size={40} style={{ color: "var(--border)", marginBottom: 12, margin: "0 auto 12px" }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>OIA Marketing AI Assistant</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Ask anything about your Google or Meta campaigns.<br />I have context about OIA Dubai and Aldar properties.</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "chat-msg-user" : "chat-msg-ai"} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                {m.role === "assistant" && (
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Bot size={14} style={{ color: "var(--navy)" }} />
                  </div>
                )}
                <div className={`chat-bubble ${m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <User size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={14} style={{ color: "var(--navy)" }} />
                </div>
                <div className="chat-bubble chat-bubble-ai"><Spinner size={14} /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <input
              className="db-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about your campaigns…"
              disabled={loading}
            />
            <button className="btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="db-card">
            <div className="db-card-title">Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_ACTIONS.map((action) => (
                <button key={action} className="btn-ghost" style={{ textAlign: "left", whiteSpace: "normal", lineHeight: 1.4, fontSize: 12, padding: "8px 12px" }}
                  onClick={() => sendMessage(action)} disabled={loading}>
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-title">Context</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Google Ads</span>
                <span className={`conn-pill ${isGoogleConnected ? "conn-pill-ok" : "conn-pill-off"}`} style={{ fontSize: 10 }}>
                  {isGoogleConnected ? "Connected" : "Not connected"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Meta Ads</span>
                <span className={`conn-pill ${isMetaConnected ? "conn-pill-ok" : "conn-pill-off"}`} style={{ fontSize: 10 }}>
                  {isMetaConnected ? "Connected" : "Not connected"}
                </span>
              </div>
              <div className="db-divider" />
              <div>Client: <strong>OIA Dubai</strong></div>
              <div style={{ fontSize: 11 }}>Aldar Yas Acres · UAE Real Estate · AED campaigns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
