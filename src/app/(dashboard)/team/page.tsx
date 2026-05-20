"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Trash2, Mail, Shield, ChevronDown, CheckCircle, Clock } from "lucide-react";

type Role = "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" | "SOCIAL_MANAGER";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
  emailVerified: string | null;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  CONTENT_CREATOR: "Content Creator",
  SEO_SPECIALIST: "SEO Specialist",
  SOCIAL_MANAGER: "Social Manager",
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "#B8860B",
  CONTENT_CREATOR: "#8B5CF6",
  SEO_SPECIALIST: "#3B82F6",
  SOCIAL_MANAGER: "#10B981",
};

const ROLE_ACCESS: Record<Role, string[]> = {
  ADMIN: ["Full access — all sections, team management, ads & agents"],
  CONTENT_CREATOR: ["Content Creator agent (Chat, Articles, New Ideas)", "AI Assistant"],
  SEO_SPECIALIST: ["SEO Specialist agent", "AI Assistant"],
  SOCIAL_MANAGER: ["Social Manager agent", "AI Assistant"],
};

export default function TeamPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role as Role;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("CONTENT_CREATOR");
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteName }),
    });
    setInviting(false);
    if (res.ok) {
      setInviteSent(true);
      setInviteEmail(""); setInviteName("");
      setTimeout(() => { setInviteSent(false); setShowInvite(false); }, 2500);
      fetchMembers();
    }
  }

  async function updateRole(id: string, role: Role) {
    setUpdatingId(id);
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    setUpdatingId(null);
    fetchMembers();
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this team member?")) return;
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMembers();
  }

  if (currentRole !== "ADMIN") {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
        <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Admin only</div>
        <div style={{ fontSize: 14 }}>Only admins can manage the team.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Team</h1>
          <p className="db-page-sub">Invite team members and assign roles — each person sees only their section</p>
        </div>
        <button
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          onClick={() => setShowInvite(v => !v)}
        >
          <Plus size={14} /> Invite Member
        </button>
      </div>

      {/* Role overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(Object.keys(ROLE_LABELS) as Role[]).map(role => (
          <div key={role} className="db-card" style={{ borderLeft: `3px solid ${ROLE_COLORS[role]}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: ROLE_COLORS[role] + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={14} color={ROLE_COLORS[role]} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{ROLE_LABELS[role]}</div>
              <div style={{
                marginLeft: "auto", fontSize: 11, background: "var(--surface-2)",
                padding: "2px 7px", borderRadius: 99, color: "var(--text-muted)",
              }}>
                {members.filter(m => m.role === role).length}
              </div>
            </div>
            {ROLE_ACCESS[role].map((access, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>• {access}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="db-card" style={{ marginBottom: 20 }}>
          <div className="db-card-title">Invite Team Member</div>
          {inviteSent ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10B981", fontSize: 14 }}>
              <CheckCircle size={16} /> Invite sent! They'll receive an email to access the dashboard.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="db-input" placeholder="Name (optional)" value={inviteName}
                  onChange={e => setInviteName(e.target.value)} style={{ flex: 1 }} />
                <input className="db-input" type="email" placeholder="Email address" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} style={{ flex: 2 }} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <select className="db-input" value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)} style={{ flex: 1 }}>
                  {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <div style={{ fontSize: 12, color: "var(--text-muted)", flex: 2 }}>
                  Access: {ROLE_ACCESS[inviteRole][0]}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  onClick={invite} disabled={inviting}>
                  <Mail size={13} /> {inviting ? "Sending…" : "Send Invite"}
                </button>
                <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowInvite(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={15} color="var(--text-muted)" />
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>Team Members</div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{members.length} total</div>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
        ) : (
          <div>
            {members.map((member, i) => (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: ROLE_COLORS[member.role] + "30",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, color: ROLE_COLORS[member.role],
                }}>
                  {(member.name || member.email || "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                    {member.name || <span style={{ color: "var(--text-muted)" }}>No name</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.email}
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, flexShrink: 0 }}>
                  {member.emailVerified
                    ? <><CheckCircle size={11} color="#10B981" /> <span style={{ color: "#10B981" }}>Active</span></>
                    : <><Clock size={11} color="var(--text-muted)" /> <span style={{ color: "var(--text-muted)" }}>Invited</span></>
                  }
                </div>

                {/* Role selector */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <select
                    className="db-input"
                    value={member.role}
                    onChange={e => updateRole(member.id, e.target.value as Role)}
                    disabled={updatingId === member.id || member.email === session?.user?.email}
                    style={{
                      fontSize: 12, padding: "4px 28px 4px 10px", appearance: "none",
                      color: ROLE_COLORS[member.role], fontWeight: 600,
                      background: ROLE_COLORS[member.role] + "15",
                      border: `1px solid ${ROLE_COLORS[member.role]}40`,
                    }}
                  >
                    {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    color: ROLE_COLORS[member.role], pointerEvents: "none",
                  }} />
                </div>

                {/* Remove */}
                {member.email !== session?.user?.email && (
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 8px", color: "#EF4444", flexShrink: 0 }}
                    onClick={() => removeMember(member.id)}
                    title="Remove member"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No team members yet. Invite your first teammate above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
