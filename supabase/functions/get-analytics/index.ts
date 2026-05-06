import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: "startDate and endDate are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching analytics from ${startDate} to ${endDate}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sessions from database
    const { data: sessions, error: sessionsError } = await supabase
      .from("analytics_sessions")
      .select("*")
      .gte("started_at", startDate)
      .lte("started_at", `${endDate}T23:59:59.999Z`);

    if (sessionsError) {
      console.error("Sessions error:", sessionsError);
      throw sessionsError;
    }

    // Fetch page views
    const { data: pageViews, error: pageViewsError } = await supabase
      .from("analytics_page_views")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", `${endDate}T23:59:59.999Z`);

    if (pageViewsError) {
      console.error("Page views error:", pageViewsError);
      throw pageViewsError;
    }

    // Calculate metrics from our database
    const uniqueVisitors = new Set(sessions?.map(s => s.visitor_id) || []).size;
    const totalPageViews = pageViews?.length || 0;
    const totalSessions = sessions?.length || 0;

    // Calculate average duration
    let totalDuration = 0;
    let durationCount = 0;
    sessions?.forEach(session => {
      if (session.started_at && session.ended_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        const duration = (end - start) / 1000;
        if (duration > 0 && duration < 3600) {
          totalDuration += duration;
          durationCount++;
        }
      }
    });
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    // Calculate bounce rate — treat NULL as bounced (historical sessions never got updated)
    const bounceSessions = sessions?.filter(s => s.is_bounce !== false).length || 0;
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

    // Calculate pages per visit
    const pagesPerVisit = totalSessions > 0 ? totalPageViews / totalSessions : 0;

    // Get top pages — filter out internal/admin routes
    const internalPaths = ["/admin", "/login", "/dashboard", "/onboarding", "/contract", "/success"];
    const pageCounts: Record<string, number> = {};
    pageViews?.forEach(pv => {
      const path = pv.path || '/';
      if (internalPaths.some(p => path.startsWith(p))) return;
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Get device breakdown
    const deviceCounts: Record<string, number> = {};
    sessions?.forEach(s => {
      const device = s.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    const devices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Get referrer breakdown
    const referrerCounts: Record<string, number> = {};
    sessions?.forEach(s => {
      let source = 'Direct';
      if (s.referrer) {
        try {
          const url = new URL(s.referrer);
          source = url.hostname;
        } catch {
          source = s.referrer;
        }
      }
      referrerCounts[source] = (referrerCounts[source] || 0) + 1;
    });
    const sources = Object.entries(referrerCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const data = {
      visitors: uniqueVisitors,
      pageViews: totalPageViews,
      avgDuration,
      bounceRate: Math.round(bounceRate * 10) / 10,
      pagesPerVisit: Math.round(pagesPerVisit * 100) / 100,
      totalSessions,
      topPages,
      devices,
      sources,
    };

    console.log("Analytics calculated:", {
      visitors: data.visitors,
      pageViews: data.pageViews,
      avgDuration: data.avgDuration,
      bounceRate: data.bounceRate,
      pagesPerVisit: data.pagesPerVisit,
    });

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
