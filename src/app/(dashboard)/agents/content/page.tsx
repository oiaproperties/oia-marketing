"use client";
import { useState, useEffect } from "react";
import { PenTool, BookOpen, Lightbulb, Plus, Trash2, Copy, Tag, Globe, Camera, AtSign, Briefcase, MessageCircle, ExternalLink, RefreshCw, CheckCircle, XCircle, Link2 } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

type Tab = "Chat" | "Articles" | "New Ideas";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  platform: string;
  tags: string[];
  date: string;
  content: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  category: "Blog" | "Social" | "Campaign" | "Video";
  priority: "High" | "Medium" | "Low";
}

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Why OIA Dubai is the #1 Choice for Luxury Real Estate in 2025",
    excerpt: "Discover why savvy investors and homebuyers are choosing OIA Dubai projects for unmatched ROI and lifestyle value in the UAE's most exclusive communities.",
    platform: "Blog",
    tags: ["luxury", "Dubai", "real estate", "investment"],
    date: "2025-05-01",
    content: "",
  },
  {
    id: "2",
    title: "Aldar Yas Acres: A Complete Guide for UAE Expat Buyers",
    excerpt: "Everything expats need to know about buying at Aldar Yas Acres — financing options, community amenities, and expected rental yields.",
    platform: "Blog",
    tags: ["Aldar", "Yas Acres", "expats", "guide"],
    date: "2025-04-15",
    content: "",
  },
];

const DEFAULT_IDEAS: Idea[] = [
  { id: "1", title: "Dubai Property Investment Guide 2025", description: "Comprehensive blog post covering ROI, visa benefits, and top areas for expat buyers.", category: "Blog", priority: "High" },
  { id: "2", title: "OIA Project Launch Instagram Reel Script", description: "Short-form vertical video script showcasing latest project renders with Arabic + English captions.", category: "Video", priority: "High" },
  { id: "3", title: "Aldar Yas Acres — Virtual Tour LinkedIn Post", description: "Professional LinkedIn article for HNW expat audience with 3D tour embed link.", category: "Social", priority: "Medium" },
  { id: "4", title: "Ramadan Property Deals Campaign", description: "Seasonal ad campaign targeting UAE nationals with exclusive Ramadan payment plans and special offers.", category: "Campaign", priority: "High" },
  { id: "5", title: "Dubai vs Abu Dhabi Investment Comparison", description: "Educational blog series — data-driven comparison to capture top-of-funnel search traffic.", category: "Blog", priority: "Medium" },
  { id: "6", title: "OIA Client Testimonials Carousel", description: "Instagram carousel featuring 5 buyer success stories with before/after lifestyle photography.", category: "Social", priority: "Low" },
];

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Blog: <Globe size={12} />,
  Instagram: <Camera size={12} />,
  Facebook: <MessageCircle size={12} />,
  Twitter: <AtSign size={12} />,
  LinkedIn: <Briefcase size={12} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Blog: "#8B5CF6",
  Social: "#3B82F6",
  Campaign: "#EF4444",
  Video: "#F59E0B",
};

const PRIORITY_COLORS = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };

const QUICK_ACTIONS = [
  "Extract Content & images for Oia website and create a content strategy",
  "Generate content for All platforms: Instagram, Facebook, Twitter, LinkedIn",
  "Write a luxury property blog post for OIA Dubai",
  "Create 5 Instagram captions for Aldar Yas Acres launch",
  "Write Google Ads copy targeting UAE expats",
  "Generate hashtags for a Dubai real estate LinkedIn post",
];

export default function ContentCreatorPage() {
  const [tab, setTab] = useState<Tab>("Chat");
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [ideas, setIdeas] = useState<Idea[]>(DEFAULT_IDEAS);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", excerpt: "", platform: "Blog", tags: "" });
  const [newIdea, setNewIdea] = useState({ title: "", description: "", category: "Blog" as Idea["category"], priority: "Medium" as Idea["priority"] });
  const [copied, setCopied] = useState<string | null>(null);
  const [autoSeoApiKey, setAutoSeoApiKey] = useState("");
  const [autoSeoConnected, setAutoSeoConnected] = useState(false);
  const [autoSeoLastSync, setAutoSeoLastSync] = useState<string | null>(null);
  const [autoSeoKeyInput, setAutoSeoKeyInput] = useState("");
  const [showAutoSeoConnect, setShowAutoSeoConnect] = useState(false);
  const [autoSeoSyncing, setAutoSeoSyncing] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("oia_content_articles");
    if (saved) setArticles(JSON.parse(saved));
    const savedIdeas = localStorage.getItem("oia_content_ideas");
    if (savedIdeas) setIdeas(JSON.parse(savedIdeas));
    const seoKey = localStorage.getItem("oia_autoseo_key");
    if (seoKey) { setAutoSeoApiKey(seoKey); setAutoSeoConnected(true); }
    const seoSync = localStorage.getItem("oia_autoseo_last_sync");
    if (seoSync) setAutoSeoLastSync(seoSync);
  }, []);

  function saveArticles(updated: Article[]) {
    setArticles(updated);
    localStorage.setItem("oia_content_articles", JSON.stringify(updated));
  }

  function saveIdeas(updated: Idea[]) {
    setIdeas(updated);
    localStorage.setItem("oia_content_ideas", JSON.stringify(updated));
  }

  function connectAutoSeo() {
    if (!autoSeoKeyInput.trim()) return;
    localStorage.setItem("oia_autoseo_key", autoSeoKeyInput.trim());
    setAutoSeoApiKey(autoSeoKeyInput.trim());
    setAutoSeoConnected(true);
    setShowAutoSeoConnect(false);
    setAutoSeoKeyInput("");
    const now = new Date().toISOString();
    localStorage.setItem("oia_autoseo_last_sync", now);
    setAutoSeoLastSync(now);
  }

  function disconnectAutoSeo() {
    localStorage.removeItem("oia_autoseo_key");
    localStorage.removeItem("oia_autoseo_last_sync");
    setAutoSeoApiKey("");
    setAutoSeoConnected(false);
    setAutoSeoLastSync(null);
  }

  function syncAutoSeo() {
    setAutoSeoSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      localStorage.setItem("oia_autoseo_last_sync", now);
      setAutoSeoLastSync(now);
      setAutoSeoSyncing(false);
    }, 1800);
  }

  function addArticle() {
    if (!newArticle.title.trim()) return;
    const article: Article = {
      id: Date.now().toString(),
      title: newArticle.title,
      excerpt: newArticle.excerpt,
      platform: newArticle.platform,
      tags: newArticle.tags.split(",").map(t => t.trim()).filter(Boolean),
      date: new Date().toISOString().split("T")[0],
      content: "",
    };
    saveArticles([article, ...articles]);
    setNewArticle({ title: "", excerpt: "", platform: "Blog", tags: "" });
    setShowNewArticle(false);
  }

  function addIdea() {
    if (!newIdea.title.trim()) return;
    const idea: Idea = { id: Date.now().toString(), ...newIdea };
    saveIdeas([idea, ...ideas]);
    setNewIdea({ title: "", description: "", category: "Blog", priority: "Medium" });
    setShowNewIdea(false);
  }

  function copyExcerpt(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const TAB_ICONS: Record<Tab, React.ReactNode> = {
    Chat: <PenTool size={13} />,
    Articles: <BookOpen size={13} />,
    "New Ideas": <Lightbulb size={13} />,
  };

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Content Creator</h1>
          <p className="db-page-sub">AI-powered content for all platforms — blog posts, captions, ad copy, and ideas</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["Chat", "Articles", "New Ideas"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "btn-primary" : "btn-ghost"}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            {TAB_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {/* CHAT TAB */}
      {tab === "Chat" && (
        <AgentChat
          agentId="content"
          agentName="Content Creator"
          agentColor="#8B5CF6"
          description="I write blog posts, social captions, ad copy, and hashtags — always within platform character limits."
          quickActions={QUICK_ACTIONS}
          icon={<PenTool size={18} color="#fff" />}
        />
      )}

      {/* ARTICLES TAB */}
      {tab === "Articles" && (
        <div>
          {/* AutoSEO Integration Card */}
          <div className="db-card" style={{ marginBottom: 16, borderColor: autoSeoConnected ? "#10B981" : "var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: autoSeoConnected ? "#10B98120" : "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Link2 size={18} color={autoSeoConnected ? "#10B981" : "var(--text-muted)"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>AutoSEO</div>
                  {autoSeoConnected
                    ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10B981", background: "#10B98120", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                        <CheckCircle size={10} /> Connected
                      </span>
                    : <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 99 }}>
                        <XCircle size={10} /> Not connected
                      </span>
                  }
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {autoSeoConnected
                    ? `Daily SEO articles enabled · Last sync: ${autoSeoLastSync ? new Date(autoSeoLastSync).toLocaleString() : "Never"}`
                    : "Connect AutoSEO to automatically generate a new SEO article every day"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {autoSeoConnected ? (
                  <>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                      onClick={syncAutoSeo}
                      disabled={autoSeoSyncing}
                    >
                      <RefreshCw size={12} style={{ animation: autoSeoSyncing ? "spin 1s linear infinite" : "none" }} />
                      {autoSeoSyncing ? "Syncing…" : "Sync Now"}
                    </button>
                    <a
                      href="https://getautoseo.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                    >
                      <ExternalLink size={12} /> Open Dashboard
                    </a>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, color: "#EF4444" }}
                      onClick={disconnectAutoSeo}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="https://getautoseo.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                    >
                      <ExternalLink size={12} /> Get API Key
                    </a>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                      onClick={() => setShowAutoSeoConnect(v => !v)}
                    >
                      <Link2 size={12} /> Connect
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Connect form */}
            {showAutoSeoConnect && !autoSeoConnected && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                <input
                  className="db-input"
                  placeholder="Paste your AutoSEO API key"
                  value={autoSeoKeyInput}
                  onChange={e => setAutoSeoKeyInput(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === "Enter" && connectAutoSeo()}
                />
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={connectAutoSeo}>Save</button>
                <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowAutoSeoConnect(false)}>Cancel</button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
              onClick={() => setShowNewArticle(v => !v)}>
              <Plus size={13} /> New Article
            </button>
          </div>

          {/* New article form */}
          {showNewArticle && (
            <div className="db-card" style={{ marginBottom: 14 }}>
              <div className="db-card-title">Add Article</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input className="db-input" placeholder="Title" value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} />
                <textarea className="db-input" placeholder="Excerpt / description" rows={2} value={newArticle.excerpt}
                  onChange={e => setNewArticle(p => ({ ...p, excerpt: e.target.value }))}
                  style={{ resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="db-input" value={newArticle.platform} onChange={e => setNewArticle(p => ({ ...p, platform: e.target.value }))}>
                    {["Blog", "Instagram", "Facebook", "Twitter", "LinkedIn"].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input className="db-input" placeholder="Tags (comma separated)" value={newArticle.tags}
                    onChange={e => setNewArticle(p => ({ ...p, tags: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ fontSize: 13 }} onClick={addArticle}>Save</button>
                  <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowNewArticle(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {articles.length === 0 && (
            <div className="db-card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <BookOpen size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No articles yet</div>
              <div style={{ fontSize: 13 }}>Ask the Content Creator to write articles, or add them manually.</div>
              <button className="btn-primary" style={{ marginTop: 14, fontSize: 13 }} onClick={() => setTab("Chat")}>
                Open Chat
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {articles.map(article => (
              <div key={article.id} className="db-card" style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                      color: "#8B5CF6", background: "#8B5CF620", padding: "2px 8px", borderRadius: 99,
                    }}>
                      {PLATFORM_ICONS[article.platform] ?? <Globe size={12} />}
                      {article.platform}
                    </div>
                    {article.tags.map(tag => (
                      <div key={tag} style={{
                        display: "flex", alignItems: "center", gap: 3, fontSize: 11,
                        color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 7px", borderRadius: 99,
                      }}>
                        <Tag size={10} /> {tag}
                      </div>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{article.date}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{article.title}</div>
                  {article.excerpt && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{article.excerpt}</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                    onClick={() => copyExcerpt(article.id, article.title + "\n\n" + article.excerpt)}
                    title="Copy">
                    {copied === article.id ? "Copied!" : <><Copy size={12} /> Copy</>}
                  </button>
                  <button className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#EF4444" }}
                    onClick={() => saveArticles(articles.filter(a => a.id !== article.id))}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW IDEAS TAB */}
      {tab === "New Ideas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{ideas.length} idea{ideas.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => { setTab("Chat"); }}>
                <PenTool size={13} /> Ask Agent for Ideas
              </button>
              <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                onClick={() => setShowNewIdea(v => !v)}>
                <Plus size={13} /> New Idea
              </button>
            </div>
          </div>

          {/* New idea form */}
          {showNewIdea && (
            <div className="db-card" style={{ marginBottom: 14 }}>
              <div className="db-card-title">Add Idea</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input className="db-input" placeholder="Idea title" value={newIdea.title} onChange={e => setNewIdea(p => ({ ...p, title: e.target.value }))} />
                <textarea className="db-input" placeholder="Description" rows={2} value={newIdea.description}
                  onChange={e => setNewIdea(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="db-input" value={newIdea.category} onChange={e => setNewIdea(p => ({ ...p, category: e.target.value as Idea["category"] }))}>
                    {["Blog", "Social", "Campaign", "Video"].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select className="db-input" value={newIdea.priority} onChange={e => setNewIdea(p => ({ ...p, priority: e.target.value as Idea["priority"] }))}>
                    {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ fontSize: 13 }} onClick={addIdea}>Save</button>
                  <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowNewIdea(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Category groups */}
          {(["Blog", "Social", "Campaign", "Video"] as const).map(category => {
            const categoryIdeas = ideas.filter(i => i.category === category);
            if (categoryIdeas.length === 0) return null;
            return (
              <div key={category} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[category], flexShrink: 0,
                  }} />
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                    {category} Ideas
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", padding: "1px 7px", borderRadius: 99 }}>
                    {categoryIdeas.length}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                  {categoryIdeas.map(idea => (
                    <div key={idea.id} className="db-card" style={{ position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          color: PRIORITY_COLORS[idea.priority],
                          background: PRIORITY_COLORS[idea.priority] + "20",
                        }}>
                          {idea.priority}
                        </div>
                        <button
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}
                          onClick={() => saveIdeas(ideas.filter(i => i.id !== idea.id))}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{idea.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{idea.description}</div>
                      <button
                        className="btn-ghost"
                        style={{ marginTop: 10, fontSize: 11, display: "flex", alignItems: "center", gap: 4, padding: "4px 10px" }}
                        onClick={() => {
                          setTab("Chat");
                          // Small delay so tab switch is visible before action fires
                          setTimeout(() => {
                            const input = document.querySelector<HTMLInputElement>('input[placeholder*="Content Creator"]');
                            if (input) { input.value = `Write content for this idea: "${idea.title}" — ${idea.description}`; input.dispatchEvent(new Event("input", { bubbles: true })); }
                          }, 100);
                        }}>
                        <ExternalLink size={10} /> Create Content
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {ideas.length === 0 && (
            <div className="db-card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <Lightbulb size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No ideas yet</div>
              <div style={{ fontSize: 13 }}>Add ideas manually or ask the agent to brainstorm for you.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
