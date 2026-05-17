import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record } = await req.json(); // This is triggered by a Supabase Database Webhook
    
    // Check if there is content to moderate
    if (!record.content) {
      return new Response(JSON.stringify({ message: "No content to moderate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Call an external AI Moderation API (e.g. OpenAI Moderation Endpoint)
    // For demonstration, we'll use OpenAI (You need to set OPENAI_API_KEY in your Supabase Dashboard Secrets)
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    let isFlagged = false;
    
    if (openAiApiKey) {
      const aiResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({ input: record.content }),
      });
      
      const moderationData = await aiResponse.json();
      isFlagged = moderationData.results[0]?.flagged || false;
    }

    // If flagged, update the post in Supabase
    if (isFlagged) {
      // Create a Supabase client with the Auth context of the function
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseAdmin
        .from("posts")
        .update({ is_flagged: true })
        .eq("id", record.id);
    }

    return new Response(JSON.stringify({ flagged: isFlagged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
