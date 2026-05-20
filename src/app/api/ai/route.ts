import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert digital advertising consultant specializing in Google Ads and Meta (Facebook/Instagram) advertising for luxury real estate in the UAE.

Your client is OIA Dubai, a premium real estate developer with campaigns for:
- Aldar Yas Acres and other luxury properties
- Target markets: UAE nationals, expat high-net-worth individuals (UK, India, Russia, KSA)
- Budget: AED 200–300/day per campaign
- Objective: Lead generation and property inquiries

You have deep expertise in:
- Google Ads: Search campaigns, RSA ads, keyword strategy, quality scores, GAQL queries
- Meta Ads: Facebook/Instagram campaigns, lead gen forms, custom audiences, lookalikes
- UAE real estate market dynamics
- Bilingual (English/Arabic) campaign optimization

When given campaign data, provide specific, actionable recommendations with:
- Priority labels: CRITICAL / IMPORTANT / OPTIMIZE
- Concrete numbers (bid adjustments, budget reallocation percentages)
- Arabic keyword suggestions when relevant

Be concise and direct. Format recommendations as bullet points.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, accountContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return apiError("messages array required", 400);
    }

    const contextNote = accountContext
      ? `\n\nCurrent account context:\n${JSON.stringify(accountContext, null, 2)}`
      : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT + contextNote,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const content = response.content[0];
    const text = content.type === "text" ? content.text : "";
    return apiSuccess({ text, usage: response.usage });
  } catch (err) {
    return handleApiError(err);
  }
}
