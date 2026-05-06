import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FUNCTION_URL_BASE = Deno.env.get("FUNCTION_URL_BASE") || "https://ckttttvgvpvflgjzkbmy.supabase.co/functions/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerResult {
  trigger: string;
  userId: string;
  email: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const results: TriggerResult[] = [];

    console.log("🚀 Starting behavioral email cron job...");

    // Get all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .order("created_at", { ascending: false });

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📊 Processing ${users?.length || 0} users...`);

    for (const user of users || []) {
      const userId = user.id;
      const email = user.email;
      const name = user.display_name || email.split("@")[0];

      // Get user's auth data for registration date
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (!authUser.user) continue;

      const registrationDate = new Date(authUser.user.created_at);
      const daysSinceRegistration = Math.floor(
        (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get user's leads and gigs
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", userId);

      const { data: gigs } = await supabase
        .from("gigs")
        .select("*")
        .eq("user_id", userId);

      const leadCount = leads?.length || 0;
      const gigCount = gigs?.length || 0;
      const contactedCount = leads?.filter(l => l.status !== "Target").length || 0;
      const repliedCount = leads?.filter(l => l.status === "Replied").length || 0;

      // Calculate days since last activity
      const latestLeadDate = leads?.length 
        ? Math.max(...leads.map(l => new Date(l.created_at).getTime())) 
        : registrationDate.getTime();
      const latestGigDate = gigs?.length 
        ? Math.max(...gigs.map(g => new Date(g.created_at).getTime())) 
        : registrationDate.getTime();
      const lastActivityDate = Math.max(latestLeadDate, latestGigDate);
      const daysSinceActivity = Math.floor((Date.now() - lastActivityDate) / (1000 * 60 * 60 * 24));

      console.log(`\n👤 User: ${email}`);
      console.log(`   Days since registration: ${daysSinceRegistration}`);
      console.log(`   Days since activity: ${daysSinceActivity}`);
      console.log(`   Leads: ${leadCount}, Contacted: ${contactedCount}, Replied: ${repliedCount}, Gigs: ${gigCount}`);

      // TRIGGER 1: Day 2 - No leads added
      if (daysSinceRegistration >= 2 && leadCount === 0) {
        console.log(`   ✉️  Triggering: Day 2 No Leads`);
        const result = await callEmailFunction("email-day2-no-leads", {
          userId,
          email,
          name,
        });
        results.push({ trigger: "day2_no_leads", userId, email, ...result });
      }

      // TRIGGER 2: Day 5 - Leads not contacted
      else if (daysSinceRegistration >= 5 && leadCount > 0 && contactedCount === 0) {
        console.log(`   ✉️  Triggering: Day 5 Not Contacted`);
        const result = await callEmailFunction("email-day5-not-contacted", {
          userId,
          email,
          name,
          leadCount,
        });
        results.push({ trigger: "day5_not_contacted", userId, email, ...result });
      }

      // TRIGGER 3: Day 10 - Replies but no bookings
      else if (daysSinceRegistration >= 10 && repliedCount > 0 && gigCount === 0) {
        console.log(`   ✉️  Triggering: Day 10 No Bookings`);
        const result = await callEmailFunction("email-day10-no-bookings", {
          userId,
          email,
          name,
          repliedCount,
        });
        results.push({ trigger: "day10_no_bookings", userId, email, ...result });
      }

      // TRIGGER 5: Day 7 - Inactive user
      else if (daysSinceActivity >= 7 && leadCount > 0) {
        console.log(`   ✉️  Triggering: Day 7 Inactive`);
        const result = await callEmailFunction("email-day7-inactive", {
          userId,
          email,
          name,
        });
        results.push({ trigger: "day7_inactive", userId, email, ...result });
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\n✅ Cron job complete!`);
    console.log(`   Emails sent: ${successCount}`);
    console.log(`   Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalUsers: users?.length || 0,
          emailsSent: successCount,
          failures: failureCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function callEmailFunction(
  functionName: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${FUNCTION_URL_BASE}/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { 
        success: false, 
        error: data.error || data.message || "Unknown error" 
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
