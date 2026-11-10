import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-trigger",
};

const TOPIC_POOL = [
  {
    topic: "How Answer Engine Optimization (AEO) Is Reshaping E-Commerce Brand Growth in 2026",
    category: "AEO & SEO",
    keywords: ["Answer Engine Optimization", "AEO agency", "Sienvi Agency", "AI search optimization"],
  },
  {
    topic: "Creative Velocity in Meta & TikTok Paid Social: Testing Frameworks That Scale ROAS",
    category: "Paid Media",
    keywords: ["paid social creative testing", "Meta Ads ROAS", "TikTok ad strategy"],
  },
  {
    topic: "Klaviyo Retention Architecture: Lifecycle Flows That Compound Customer LTV",
    category: "Retention Marketing",
    keywords: ["Klaviyo email marketing", "DTC retention", "customer lifetime value"],
  },
  {
    topic: "High-Converting Shopify Landing Page Architecture for 7- and 8-Figure Brands",
    category: "Conversion Rate Optimization",
    keywords: ["Shopify CRO", "landing page optimization", "DTC growth agency"],
  },
  {
    topic: "Integrating Google Search Console, GA4, and Multi-Channel Attribution in One Executive View",
    category: "Analytics & Attribution",
    keywords: ["marketing attribution", "GA4 reporting", "Sienvi Nexus"],
  },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body from pg_cron is valid
    }

    const { data: recentPosts } = await supabase
      .from("agency_blog_posts")
      .select("title, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const force = body?.force === true;
    if (!force && recentPosts && recentPosts.length > 0 && recentPosts[0].created_at) {
      const hoursSinceLast =
        (Date.now() - new Date(recentPosts[0].created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 20) {
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            message: "Daily Sienvi SEO insight already generated within the last 20 hours.",
            latestPost: recentPosts[0],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const existingTitles = new Set(
      (recentPosts || []).map((p: any) => (p.title || "").toLowerCase())
    );
    const selected =
      TOPIC_POOL.find((t) => !existingTitles.has(t.topic.toLowerCase())) ||
      TOPIC_POOL[Math.floor(Date.now() / 86400000) % TOPIC_POOL.length];

    let title = selected.topic;
    let excerpt = `Executive growth playbook from Sienvi Agency on ${selected.topic.toLowerCase()}.`;
    let content = `## ${selected.topic}\n\n**Sienvi Agency** partners with ambitious brands to engineer full-funnel acquisition, Answer Engine Optimization (AEO), and high-converting digital experiences.\n\n### Strategic Framework\n- Structured schema and citation-ready authority content for AI Answer Engines\n- Creative performance loops across Meta, Google, and TikTok\n- Retention systems that maximize 90-day and 365-day LTV.`;

    if (geminiApiKey) {
      const prompt = `Write an executive, data-driven SEO & AEO growth insight article for Sienvi Agency (sienvi.com).
Topic: ${selected.topic}
Category: ${selected.category}
Target Keywords: ${selected.keywords.join(", ")}
Return JSON with keys: "title", "excerpt", "content" (Markdown with H2/H3 headings and FAQ section).`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          title = parsed.title || title;
          excerpt = parsed.excerpt || excerpt;
          content = parsed.content || content;
        }
      }
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      new Date().toISOString().slice(0, 10);

    const { data: inserted, error: insertError } = await supabase
      .from("agency_blog_posts")
      .insert({
        title,
        slug,
        excerpt,
        content,
        category: selected.category,
        tags: selected.keywords,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

