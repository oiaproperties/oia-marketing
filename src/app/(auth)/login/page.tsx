"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Mail, ArrowRight, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const isVerify = searchParams.get("verify") === "1";

  const [mode, setMode] = useState<"password" | "email">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("admin-password", {
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (result?.error) {
      setError("Incorrect password.");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const result = await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
    setLoading(false);
    if (result?.error) {
      setError("Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{
      width: "100%", maxWidth: 400,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 40,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, color: "#fff",
        }}>OIA</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>OIA — Marketing</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Team Portal</div>
        </div>
      </div>

      {/* Email verify state */}
      {(sent || isVerify) ? (
        <div style={{ textAlign: "center" }}>
          <CheckCircle size={48} color="var(--gold)" style={{ margin: "0 auto 16px" }} />
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            We sent a sign-in link to <strong>{email || "your email"}</strong>.<br />
            Click it to access your dashboard.
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: "var(--text-muted)" }}>
            Didn't get it?{" "}
            <button style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, padding: 0 }}
              onClick={() => setSent(false)}>Try again</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Sign in</div>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 4, borderRadius: 10, marginBottom: 20 }}>
            {([["password", "Admin Password"], ["email", "Magic Link"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text-muted)",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Password form */}
          {mode === "password" && (
            <form onSubmit={handlePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }} />
                <input
                  className="db-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0,
                  }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <div style={{ fontSize: 13, color: "#EF4444" }}>{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
                {loading ? "Signing in…" : <><span>Sign in as Admin</span> <ArrowRight size={14} /></>}
              </button>
            </form>
          )}

          {/* Email form */}
          {mode === "email" && (
            <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }} />
                <input
                  className="db-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  required
                  autoFocus
                />
              </div>
              {error && <div style={{ fontSize: 13, color: "#EF4444" }}>{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
                {loading ? "Sending…" : <><span>Send sign-in link</span> <ArrowRight size={14} /></>}
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Only invited team members can access this portal.
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
