"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";

interface ToolCallDisplayProps {
  name: string;
  input: Record<string, unknown>;
  result?: string;
}

export default function ToolCallDisplay({ name, input, result }: ToolCallDisplayProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      margin: "4px 0",
      border: "1px solid var(--border)",
      borderRadius: 6,
      fontSize: 12,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "6px 10px",
          background: "var(--surface-2)",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          textAlign: "left",
        }}
      >
        <Wrench size={11} style={{ color: "var(--gold)", flexShrink: 0 }} />
        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--gold)" }}>{name}</span>
        <span style={{ flex: 1 }} />
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>

      {open && (
        <div style={{ padding: "8px 10px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 11, color: "var(--text)" }}>
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {result !== undefined && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Result</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 11, color: "var(--text)" }}>
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
