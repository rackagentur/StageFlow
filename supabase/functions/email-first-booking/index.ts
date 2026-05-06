import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserData {
  userId: string;
  email: string;
  name: string;
  gigName: string;
}

const emailTemplate = (name: string, gigName: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 You booked your first gig!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse;">
          
          <tr>
            <td style="padding: 0 0 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px; color: #8b5cf6;">
                NOXREACH
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0;">
              
              <div style="text-align: center; margin: 0 0 32px 0;">
                <div style="font-size: 64px; margin: 0 0 16px 0;">🎉</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; line-height: 1.2; color: #ffffff;">
                  You booked your first gig!
                </h2>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                Hey ${name},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                I'm proud of you.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                You added the lead. You reached out. You followed up. And now you've got a confirmed gig.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                That's not luck. That's work.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                This is the first of many. I know it.
              </p>
              
              <table role="presentation" style="margin: 0 0 32px 0; width: 100%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 32px 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
                      Your First Booking
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                      ${gigName}
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="margin: 0 0 32px 0; width: 100%; background: #18181b; border-radius: 8px; border: 1px solid #27272a;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #8b5cf6; text-transform: uppercase; letter-spacing: 1px;">
                      What's Next
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #a1a1aa;">
                      <li style="margin: 0 0 12px 0; line-height: 1.6;">
                        <strong style="color: #ffffff;">Keep the momentum.</strong> Add more leads while you're feeling confident.
                      </li>
                      <li style="margin: 0 0 12px 0; line-height: 1.6;">
                        <strong style="color: #ffffff;">Confirm the details.</strong> Tech specs, load-in time, payment terms — lock it in.
                      </li>
                      <li style="margin: 0; line-height: 1.6;">
                        <strong style="color: #ffffff;">Book the next one.</strong> One gig is great. Two is a streak. Let's build.
                      </li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="padding: 0;">
                    <a href="https://app.noxreach.com" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Keep Building
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                This is just the beginning.
              </p>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                See you on the dance floor.
              </p>
              
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 0 0 0;">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                Gregorgus Geez
              </p>
              <p style="margin: 0; font-size: 14px; color: #71717a;">
                Founder, NoxReach
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 0 0 0; border-top: 1px solid #27272a; margin-top: 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #52525b; text-align: center;">
                You're receiving this because you signed up for NoxReach.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { userId, email, name, gigName }: UserData = await req.json();

    // Check if email already sent
    const { data: alreadySent } = await supabase
      .from("email_sends")
      .select("id")
      .eq("user_id", userId)
      .eq("email_type", "first_booking")
      .single();

    if (alreadySent) {
      return new Response(
        JSON.stringify({ success: false, message: "Email already sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NoxReach <noxreach@soundofgeez.com>",
        to: [email],
        subject: "🎉 You booked your first gig!",
        html: emailTemplate(name, gigName),
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    // Log email send
    await supabase.from("email_sends").insert({
      user_id: userId,
      email_type: "first_booking",
      resend_id: resendData.id,
      metadata: { email, name, gigName },
    });

    return new Response(
      JSON.stringify({ success: true, resendId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
