"use client";
import { notFound } from "next/navigation";
import { Search, PenTool, Share2, Shield, TrendingUp } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const AGENTS: Record<string, {
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  quickActions: string[];
}> = {
  seo: {
    name: "SEO Specialist",
    color: "#10B981",
    icon: <Search size={18} color="#fff" />,
    description: "I research keywords, analyse page content, generate meta tags, and score your content for SEO performance.",
    quickActions: [
      "Research keywords for luxury real estate in Dubai",
      "Analyse this URL for SEO: https://example.com",
      "Generate meta tags for a property listing page",
      "Who are the top competitors for 'buy apartment Dubai'?",
      "Score this blog post for SEO quality",
    ],
  },
  content: {
    name: "Content Creator",
    color: "#8B5CF6",
    icon: <PenTool size={18} color="#fff" />,
    description: "I write blog posts, social captions, ad copy, and hashtags — always within platform character limits.",
    quickActions: [
      "Write a blog post about investing in Dubai real estate",
      "Create 5 Instagram captions for a luxury apartment launch",
      "Write Google Ads copy for Aldar Yas Acres",
      "Generate hashtags for a LinkedIn property post",
      "Draft a Facebook ad for a UAE expat audience",
    ],
  },
  social: {
    name: "Social Media Manager",
    color: "#3B82F6",
    icon: <Share2 size={18} color="#fff" />,
    description: "I build content calendars, schedule posts, analyse platform performance, and find the best posting times.",
    quickActions: [
      "Build a 30-day content calendar for Instagram",
      "What are the best posting times for LinkedIn in UAE?",
      "Analyse our Facebook page performance this month",
      "Create a Twitter content strategy for property launches",
      "Schedule a week of posts for all platforms",
    ],
  },
  moderator: {
    name: "Moderator",
    color: "#F59E0B",
    icon: <Shield size={18} color="#fff" />,
    description: "I moderate comments, score toxicity, check brand voice, detect crisis patterns, and draft response templates.",
    quickActions: [
      "Moderate these comments: [paste comments here]",
      "Check if this comment violates brand guidelines",
      "Score the toxicity of: 'This company is terrible!'",
      "Detect if we have a coordinated negative campaign",
      "Generate a response template for price complaints",
    ],
  },
  "media-buyer": {
    name: "Media Buyer",
    color: "#EF4444",
    icon: <TrendingUp size={18} color="#fff" />,
    description: "I plan Meta and Google Ads campaigns, allocate budgets, and analyse ROI. I always show a plan and wait for CONFIRM before executing.",
    quickActions: [
      "Plan a Meta campaign for Aldar Yas Acres, budget AED 10,000",
      "Allocate AED 50,000 budget across Meta and Google",
      "Get insights for our current Meta campaigns",
      "Suggest audience targeting for UAE luxury real estate",
      "Analyse ROI across all active campaigns",
    ],
  },
};

export default function AgentPage({ params }: { params: { agentId: string } }) {
  const agent = AGENTS[params.agentId];
  if (!agent) notFound();

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">{agent.name}</h1>
          <p className="db-page-sub">{agent.description}</p>
        </div>
      </div>

      <AgentChat
        agentId={params.agentId}
        agentName={agent.name}
        agentColor={agent.color}
        description={agent.description}
        quickActions={agent.quickActions}
        icon={agent.icon}
      />
    </div>
  );
}
