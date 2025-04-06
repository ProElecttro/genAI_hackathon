import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Judge0 API configuration
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = Deno.env.get("JUDGE0_API_KEY");
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    if (!JUDGE0_API_KEY) {
      throw new Error("JUDGE0_API_KEY is not configured");
    }

    const { code, input = "" } = await req.json();

    if (!code) {
      throw new Error("Missing required parameter: code");
    }

    // Create submission
    const submission = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": JUDGE0_API_HOST,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: 54, // C++ (GCC 9.2.0)
        stdin: input,
      }),
    });

    if (!submission.ok) {
      throw new Error(`Failed to create submission: ${submission.status}`);
    }

    const { token } = await submission.json();

    // Wait for the result (with timeout)
    let result;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": JUDGE0_API_HOST,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get submission result: ${response.status}`);
      }

      result = await response.json();

      if (result.status.id > 2) { // Status > 2 means processing is complete
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!result || attempts >= maxAttempts) {
      throw new Error("Compilation timed out");
    }

    // Process the result
    const output = {
      output: result.stdout || "",
      error: result.stderr || result.compile_output || null,
      exitCode: result.status.id === 3 ? 0 : 1, // 3 = Accepted
      success: result.status.id === 3
    };

    return new Response(JSON.stringify(output), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
        output: null,
        exitCode: 1
      }),
      {
        status: error instanceof Error && error.message.includes("not configured") ? 500 : 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});