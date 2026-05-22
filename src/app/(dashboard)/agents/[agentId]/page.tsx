import { redirect } from "next/navigation";

// Dedicated pages exist at /agents/seo, /agents/content, /agents/social
// Any unrecognised agent ID (e.g. old moderator / media-buyer links) redirects to the agents overview
export default function AgentFallbackPage() {
  redirect("/agents");
}
