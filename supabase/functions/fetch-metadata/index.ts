import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL parameter" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch the HTML content of the target URL
    const htmlResponse = await fetch(url);
    const htmlText = await htmlResponse.text();

    // Use simple Regex to extract OpenGraph tags (for edge functions to keep it lightweight)
    const titleMatch = htmlText.match(/<meta property="og:title" content="([^"]+)"/i) || htmlText.match(/<title>([^<]+)<\/title>/i);
    const descriptionMatch = htmlText.match(/<meta property="og:description" content="([^"]+)"/i) || htmlText.match(/<meta name="description" content="([^"]+)"/i);
    const imageMatch = htmlText.match(/<meta property="og:image" content="([^"]+)"/i);

    const metadata = {
      title: titleMatch ? titleMatch[1] : null,
      description: descriptionMatch ? descriptionMatch[1] : null,
      image: imageMatch ? imageMatch[1] : null,
      url: url,
    };

    return new Response(JSON.stringify(metadata), {
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
