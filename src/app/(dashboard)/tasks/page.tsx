"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Trash2, ExternalLink, Calendar, FileText, Image,
  ChevronDown, X, AlertCircle, Clock, CheckCircle2, CircleDot,
  Eye, Send, Link2,
} from "lucide-react";

type Status = "NEW" | "IN_PROGRESS" | "REVIEW" | "DONE" | "PUBLISHED";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type Role = "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" | "SOCIAL_MANAGER";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  assignedTo: Role;
  status: Status;
  priority: Priority;
  dueDate?: string | null;
  documentLink?: string | null;
  contentLink?: string | null;
  creativeLink?: string | null;
  createdLink?: string | null;
  publishedLink?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

const COLUMNS: { id: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "NEW",         label: "New Task",    icon: <CircleDot size={13} />,    color: "#6B7280" },
  { id: "IN_PROGRESS", label: "In Progress", icon: <Clock size={13} />,        color: "#3B82F6" },
  { id: "REVIEW",      label: "Review",      icon: <Eye size={13} />,          color: "#F59E0B" },
  { id: "DONE",        label: "Done",        icon: <CheckCircle2 size={13} />, color: "#10B981" },
  { id: "PUBLISHED",   label: "Published",   icon: <Send size={13} />,         color: "#8B5CF6" },
];

const ROLES: Role[] = ["ADMIN", "CONTENT_CREATOR", "SEO_SPECIALIST", "SOCIAL_MANAGER"];

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

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  HIGH:   { label: "High",   color: "#EF4444" },
  MEDIUM: { label: "Medium", color: "#F59E0B" },
  LOW:    { label: "Low",    color: "#10B981" },
};

const EMPTY_FORM = {
  title: "", description: "",
  assignedTo: "CONTENT_CREATOR" as Role,
  status: "NEW" as Status,
  priority: "MEDIUM" as Priority,
  dueDate: "", documentLink: "", contentLink: "", creativeLink: "", createdLink: "", publishedLink: "",
};

const LINK_CONFIG = [
  { key: "documentLink",  label: "Document",  icon: <FileText size={10} />, color: "#6B7280", placeholder: "Google Doc / Drive brief…" },
  { key: "contentLink",   label: "Content",   icon: <FileText size={10} />, color: "#3B82F6", placeholder: "Written copy / captions…"   },
  { key: "creativeLink",  label: "Creative",  icon: <Image size={10} />,    color: "#F59E0B", placeholder: "Canva / design file…"         },
  { key: "createdLink",   label: "Created",   icon: <Image size={10} />,    color: "#10B981", placeholder: "Final created asset…"         },
  { key: "publishedLink", label: "Published", icon: <Send size={10} />,     color: "#8B5CF6", placeholder: "Instagram / Facebook / TikTok…" },
] as const;

export default function TasksPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role as Role || "ADMIN";
  const isAdmin = currentRole === "ADMIN";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<Role | "ALL">(isAdmin ? "ALL" : currentRole);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<{ id: string; documentLink: string; contentLink: string; creativeLink: string; createdLink: string; publishedLink: string } | null>(null);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }

  async function createTask() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(EMPTY_FORM);
    setShowNew(false);
    fetchTasks();
  }

  async function moveTask(id: string, status: Status) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  async function saveLinks(id: string, links: { documentLink: string; contentLink: string; creativeLink: string; createdLink: string; publishedLink: string }) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        documentLink: links.documentLink || null,
        contentLink: links.contentLink || null,
        creativeLink: links.creativeLink || null,
        createdLink: links.createdLink || null,
        publishedLink: links.publishedLink || null,
      }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...links } : t));
    setEditLinks(null);
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  const filteredByRole = roleTab === "ALL" ? tasks : tasks.filter(t => t.assignedTo === roleTab);

  function isOverdue(dueDate?: string | null, status?: Status) {
    if (!dueDate || status === "DONE" || status === "PUBLISHED") return false;
    return new Date(dueDate) < new Date();
  }

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = tasks.filter(t => t.assignedTo === r).length;
    return acc;
  }, {} as Record<Role, number>);

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Task Board</h1>
          <p className="db-page-sub">Assign, track and publish work across the team</p>
        </div>
        {isAdmin && (
          <button className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
            onClick={() => setShowNew(v => !v)}>
            <Plus size={14} /> New Task
          </button>
        )}
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {isAdmin && (
          <button
            onClick={() => setRoleTab("ALL")}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              background: roleTab === "ALL" ? "var(--gold)" : "var(--surface-2)",
              color: roleTab === "ALL" ? "#fff" : "var(--text-muted)",
            }}>
            All <span style={{ opacity: 0.7 }}>({tasks.length})</span>
          </button>
        )}
        {ROLES.map(r => (
          <button key={r} onClick={() => setRoleTab(r)}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              background: roleTab === r ? ROLE_COLORS[r] : "var(--surface-2)",
              color: roleTab === r ? "#fff" : "var(--text-muted)",
            }}>
            {ROLE_LABELS[r]} <span style={{ opacity: 0.7 }}>({roleCounts[r]})</span>
          </button>
        ))}
      </div>

      {/* New task form */}
      {showNew && isAdmin && (
        <div className="db-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="db-card-title" style={{ margin: 0 }}>New Task</div>
            <button onClick={() => setShowNew(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="db-input" placeholder="Task title *" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <textarea className="db-input" placeholder="Description (optional)" rows={2}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: "vertical", fontFamily: "inherit" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Assign to role</div>
                <select className="db-input" value={form.assignedTo}
                  onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value as Role }))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Stage</div>
                <select className="db-input" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Priority</div>
                <select className="db-input" value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Due date</div>
                <input className="db-input" type="date" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>

            {/* Links */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {LINK_CONFIG.map(lc => (
                <div key={lc.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: lc.color, marginBottom: 4, fontWeight: 600 }}>
                    {lc.icon} {lc.label}
                  </div>
                  <input className="db-input" placeholder={lc.placeholder}
                    value={(form as any)[lc.key]}
                    onChange={e => setForm(p => ({ ...p, [lc.key]: e.target.value }))}
                    style={{ fontSize: 11 }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={createTask} disabled={saving}>
                {saving ? "Saving…" : "Create Task"}
              </button>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, alignItems: "start" }}>
          {COLUMNS.map(col => {
            const colTasks = filteredByRole.filter(t => t.status === col.id);
            return (
              <div key={col.id}>
                {/* Column header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
                  padding: "8px 10px", borderRadius: 8,
                  background: col.color + "15", borderLeft: `3px solid ${col.color}`,
                }}>
                  <span style={{ color: col.color }}>{col.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 11, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {col.label}
                  </span>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, background: col.color + "25",
                    color: col.color, padding: "1px 6px", borderRadius: 99, fontWeight: 700,
                  }}>{colTasks.length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {colTasks.map(task => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const expanded = expandedTask === task.id;
                    const editingLinks = editLinks?.id === task.id;
                    const roleColor = ROLE_COLORS[task.assignedTo];

                    return (
                      <div key={task.id} className="db-card"
                        style={{
                          padding: 11, cursor: "pointer",
                          border: overdue ? "1px solid #EF444440" : `1px solid var(--border)`,
                          borderTop: `3px solid ${roleColor}`,
                        }}
                        onClick={() => setExpandedTask(expanded ? null : task.id)}>

                        {/* Priority + delete */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99,
                            color: PRIORITY_CONFIG[task.priority].color,
                            background: PRIORITY_CONFIG[task.priority].color + "20",
                          }}>{PRIORITY_CONFIG[task.priority].label}</span>
                          {overdue && <AlertCircle size={11} color="#EF4444" style={{ marginLeft: "auto" }} />}
                          {isAdmin && (
                            <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                              style={{ marginLeft: overdue ? 0 : "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>

                        {/* Role badge */}
                        {roleTab === "ALL" && (
                          <div style={{
                            fontSize: 9, fontWeight: 700, color: roleColor,
                            background: roleColor + "18", padding: "2px 6px", borderRadius: 99,
                            display: "inline-block", marginBottom: 5,
                          }}>{ROLE_LABELS[task.assignedTo]}</div>
                        )}

                        {/* Title */}
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", lineHeight: 1.4, marginBottom: 5 }}>
                          {task.title}
                        </div>

                        {/* Due date */}
                        {task.dueDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: overdue ? "#EF4444" : "var(--text-muted)", marginBottom: 6 }}>
                            <Calendar size={9} />
                            {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            {overdue && " · Overdue"}
                          </div>
                        )}

                        {/* Link pills */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {LINK_CONFIG.map(lc => {
                            const href = (task as any)[lc.key];
                            if (!href) return null;
                            return (
                              <a key={lc.key} href={href} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 600,
                                  color: lc.color, background: lc.color + "18", padding: "3px 7px", borderRadius: 5, textDecoration: "none" }}>
                                {lc.icon} {lc.label}
                              </a>
                            );
                          })}
                        </div>

                        {/* Expanded */}
                        {expanded && (
                          <div onClick={e => e.stopPropagation()}
                            style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>

                            {task.description && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
                                {task.description}
                              </div>
                            )}

                            {/* Move buttons */}
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 5 }}>Move to:</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                              {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                <button key={c.id} onClick={() => moveTask(task.id, c.id)}
                                  style={{
                                    fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "none",
                                    cursor: "pointer", background: c.color + "20", color: c.color,
                                    fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
                                  }}>
                                  {c.icon} {c.label}
                                </button>
                              ))}
                            </div>

                            {/* Links editor */}
                            {editingLinks ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                  {LINK_CONFIG.map(lc => (
                                    <div key={lc.key}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: lc.color, marginBottom: 3, fontWeight: 600 }}>
                                        {lc.icon} {lc.label} link
                                      </div>
                                      <input className="db-input" placeholder={lc.placeholder}
                                        value={(editLinks as any)[lc.key]}
                                        onChange={e => setEditLinks(p => p ? { ...p, [lc.key]: e.target.value } : p)}
                                        style={{ fontSize: 11 }} />
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="btn-primary" style={{ fontSize: 11 }}
                                    onClick={() => saveLinks(task.id, {
                                      documentLink: editLinks.documentLink,
                                      contentLink: editLinks.contentLink,
                                      creativeLink: editLinks.creativeLink,
                                      createdLink: editLinks.createdLink,
                                      publishedLink: editLinks.publishedLink,
                                    })}>
                                    Save
                                  </button>
                                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setEditLinks(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button className="btn-ghost"
                                style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                onClick={() => setEditLinks({
                                  id: task.id,
                                  documentLink: task.documentLink || "",
                                  contentLink: task.contentLink || "",
                                  creativeLink: task.creativeLink || "",
                                  createdLink: task.createdLink || "",
                                  publishedLink: task.publishedLink || "",
                                })}>
                                <Link2 size={10} />
                                {LINK_CONFIG.some(lc => (task as any)[lc.key]) ? "Edit links" : "Add links"}
                              </button>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                          <ChevronDown size={11} color="var(--text-muted)"
                            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div style={{
                      border: "1.5px dashed var(--border)", borderRadius: 10,
                      padding: "18px 10px", textAlign: "center",
                      color: "var(--text-muted)", fontSize: 11,
                    }}>No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
