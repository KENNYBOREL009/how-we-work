import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// AI Provider configuration - change AI_PROVIDER to switch
// Options: "lovable" (default), "openai", "anthropic", "gemini"
const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "lovable";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Cache settings
const CACHE_TTL_MINUTES = 15;
const MIN_DATA_CHANGE_THRESHOLD = 0.2; // 20% change required to refresh

interface TrafficData {
  signals: Array<{
    latitude: number;
    longitude: number;
    people_count: number;
    created_at: string;
  }>;
  historicalPatterns: Array<{
    zone_lat: number;
    zone_lng: number;
    hour_of_day: number;
    day_of_week: number;
    avg_demand: number;
    peak_demand: number;
  }>;
  recentTrips: Array<{
    origin: string;
    destination: string;
    fare: number;
    created_at: string;
  }>;
  learnedRoutes: Array<{
    origin_name: string;
    destination_name: string;
    trip_count: number;
    popularity_score: number;
  }>;
}

// Simple hash function for cache comparison
function hashData(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Calculate data similarity (returns 0-1, where 1 is identical)
function calculateDataSimilarity(oldData: TrafficData, newData: TrafficData): number {
  const oldSignalCount = oldData.signals?.length || 0;
  const newSignalCount = newData.signals?.length || 0;
  
  if (oldSignalCount === 0 && newSignalCount === 0) return 1;
  if (oldSignalCount === 0 || newSignalCount === 0) return 0;
  
  const signalDiff = Math.abs(oldSignalCount - newSignalCount) / Math.max(oldSignalCount, newSignalCount);
  
  const oldPeopleTotal = oldData.signals.reduce((sum, s) => sum + s.people_count, 0);
  const newPeopleTotal = newData.signals.reduce((sum, s) => sum + s.people_count, 0);
  const peopleDiff = oldPeopleTotal > 0 
    ? Math.abs(oldPeopleTotal - newPeopleTotal) / Math.max(oldPeopleTotal, newPeopleTotal)
    : 0;
  
  return 1 - ((signalDiff + peopleDiff) / 2);
}

// Multi-provider AI call
async function callAI(systemPrompt: string, userPrompt: string, responseSchema: any): Promise<any> {
  const provider = AI_PROVIDER.toLowerCase();
  
  console.log(`[AI] Using provider: ${provider}`);
  
  switch (provider) {
    case "openai": {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "traffic_analysis",
              description: "Analyse du trafic et recommandations",
              parameters: responseSchema
            }
          }],
          tool_choice: { type: "function", function: { name: "traffic_analysis" } }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
      }
      
      const data = await response.json();
      return JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    }
    
    case "anthropic": {
      if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          tools: [{
            name: "traffic_analysis",
            description: "Analyse du trafic et recommandations",
            input_schema: responseSchema
          }],
          tool_choice: { type: "tool", name: "traffic_analysis" }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic error: ${response.status}`);
      }
      
      const data = await response.json();
      const toolUse = data.content?.find((c: any) => c.type === "tool_use");
      return toolUse?.input || {};
    }
    
    case "gemini": {
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nRéponds UNIQUEMENT en JSON valide selon ce schéma: ${JSON.stringify(responseSchema)}` }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(text);
    }
    
    case "lovable":
    default: {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "traffic_analysis",
              description: "Analyse du trafic et recommandations",
              parameters: responseSchema
            }
          }],
          tool_choice: { type: "function", function: { name: "traffic_analysis" } }
        }),
      });
      
      if (!response.ok) {
        const status = response.status;
        if (status === 429) throw new Error("RATE_LIMIT");
        if (status === 402) throw new Error("INSUFFICIENT_CREDITS");
        throw new Error(`Lovable AI error: ${status}`);
      }
      
      const data = await response.json();
      return JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, driverId, driverLocation, forceRefresh } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all relevant data
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    console.log(`[Traffic] Action: ${action}, Hour: ${hourOfDay}, Day: ${dayOfWeek}`);

    // Get active signals
    const { data: signals } = await supabase
      .from("client_signals")
      .select("latitude, longitude, people_count, created_at")
      .gt("expires_at", now.toISOString());

    // Get historical patterns for current time window (+/- 2 hours)
    const { data: patterns } = await supabase
      .from("traffic_patterns")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .gte("hour_of_day", Math.max(0, hourOfDay - 2))
      .lte("hour_of_day", Math.min(23, hourOfDay + 2));

    // Get recent completed trips (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentTrips } = await supabase
      .from("trips")
      .select("origin, destination, fare, created_at")
      .eq("status", "completed")
      .gte("created_at", weekAgo.toISOString())
      .limit(100);

    // Get learned routes
    const { data: learnedRoutes } = await supabase
      .from("learned_routes")
      .select("*")
      .order("popularity_score", { ascending: false })
      .limit(20);

    const trafficData: TrafficData = {
      signals: signals || [],
      historicalPatterns: patterns || [],
      recentTrips: recentTrips || [],
      learnedRoutes: learnedRoutes || [],
    };

    // Cache key based on action and time window
    const cacheKey = `${action}_${hourOfDay}_${dayOfWeek}`;
    const currentDataHash = hashData(trafficData);

    // Check cache (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedResult } = await supabase
        .from("ai_cache")
        .select("*")
        .eq("cache_key", cacheKey)
        .gt("expires_at", now.toISOString())
        .single();

      if (cachedResult) {
        // Check if data has changed significantly
        const similarity = cachedResult.data_hash === currentDataHash ? 1 : 
          calculateDataSimilarity(cachedResult.result.sourceData || {}, trafficData);
        
        if (similarity > (1 - MIN_DATA_CHANGE_THRESHOLD)) {
          console.log(`[Cache] HIT for ${cacheKey}, similarity: ${(similarity * 100).toFixed(1)}%`);
          return new Response(
            JSON.stringify({ success: true, data: cachedResult.result, fromCache: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`[Cache] Data changed significantly (${((1-similarity) * 100).toFixed(1)}%), refreshing...`);
      }
    }

    console.log(`[Cache] MISS for ${cacheKey}, calling AI...`);

    // Build AI prompt based on action
    const systemPrompt = `Tu es un expert en analyse de trafic urbain à Douala, Cameroun. 
Tu analyses les données de transport pour aider les chauffeurs de taxi à optimiser leurs trajets.
Réponds toujours en JSON valide selon le schéma demandé.
Heure actuelle: ${hourOfDay}h, Jour: ${["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][dayOfWeek]}`;

    let userPrompt = "";
    let responseSchema: any = {};

    switch (action) {
      case "predict_traffic":
        userPrompt = `Analyse ces données de trafic et prédit les zones de forte demande:

Signaux actifs (clients en attente): ${JSON.stringify(trafficData.signals)}
Patterns historiques: ${JSON.stringify(trafficData.historicalPatterns)}
Trajets récents: ${JSON.stringify(trafficData.recentTrips.slice(0, 20))}

Génère des prédictions de demande pour les 2 prochaines heures.`;

        responseSchema = {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  zone_name: { type: "string" },
                  zone_lat: { type: "number" },
                  zone_lng: { type: "number" },
                  predicted_demand: { type: "integer" },
                  confidence: { type: "number" },
                  peak_time: { type: "string" },
                  reason: { type: "string" }
                },
                required: ["zone_name", "zone_lat", "zone_lng", "predicted_demand", "confidence", "reason"]
              }
            },
            summary: { type: "string" }
          },
          required: ["predictions", "summary"]
        };
        break;

      case "learn_routes":
        userPrompt = `Analyse ces trajets récents pour identifier les nouvelles routes populaires:

Trajets récents: ${JSON.stringify(trafficData.recentTrips)}
Routes déjà connues: ${JSON.stringify(trafficData.learnedRoutes)}

Identifie les nouvelles tendances de trajets et mets à jour les scores de popularité.`;

        responseSchema = {
          type: "object",
          properties: {
            new_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  origin_name: { type: "string" },
                  destination_name: { type: "string" },
                  estimated_demand: { type: "integer" },
                  is_trending: { type: "boolean" },
                  reason: { type: "string" }
                },
                required: ["origin_name", "destination_name", "estimated_demand", "is_trending"]
              }
            },
            updated_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  origin_name: { type: "string" },
                  destination_name: { type: "string" },
                  new_popularity_score: { type: "number" }
                },
                required: ["origin_name", "destination_name", "new_popularity_score"]
              }
            },
            insights: { type: "string" }
          },
          required: ["new_routes", "updated_routes", "insights"]
        };
        break;

      case "recommend_zones":
        userPrompt = `Recommande les meilleures zones de positionnement pour ce chauffeur:

Position actuelle: ${JSON.stringify(driverLocation)}
Signaux actifs: ${JSON.stringify(trafficData.signals)}
Patterns historiques (cette période): ${JSON.stringify(trafficData.historicalPatterns)}
Routes populaires: ${JSON.stringify(trafficData.learnedRoutes.slice(0, 10))}

Génère des recommandations de positionnement personnalisées.`;

        responseSchema = {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  zone_lat: { type: "number" },
                  zone_lng: { type: "number" },
                  predicted_demand: { type: "integer" },
                  confidence_score: { type: "number" },
                  valid_minutes: { type: "integer" }
                },
                required: ["title", "description", "priority", "zone_lat", "zone_lng", "predicted_demand", "confidence_score"]
              }
            },
            best_action: { type: "string" }
          },
          required: ["recommendations", "best_action"]
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Call AI (multi-provider)
    let result: any;
    try {
      result = await callAI(systemPrompt, userPrompt, responseSchema);
    } catch (aiError: any) {
      if (aiError.message === "RATE_LIMIT") {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiError.message === "INSUFFICIENT_CREDITS") {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw aiError;
    }

    // Cache the result
    const cacheExpiry = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000);
    await supabase.from("ai_cache").upsert({
      cache_key: cacheKey,
      action,
      data_hash: currentDataHash,
      result: { ...result, sourceData: trafficData },
      expires_at: cacheExpiry.toISOString()
    }, { onConflict: "cache_key" });

    console.log(`[Cache] Stored result for ${cacheKey}, expires: ${cacheExpiry.toISOString()}`);

    // Store results in database based on action
    if (action === "predict_traffic" && result.predictions) {
      for (const pred of result.predictions) {
        await supabase.from("traffic_patterns").upsert({
          zone_lat: pred.zone_lat,
          zone_lng: pred.zone_lng,
          zone_name: pred.zone_name,
          hour_of_day: hourOfDay,
          day_of_week: dayOfWeek,
          peak_demand: pred.predicted_demand,
          avg_demand: pred.predicted_demand,
          sample_count: 1,
          updated_at: now.toISOString()
        }, { onConflict: "zone_lat,zone_lng,hour_of_day,day_of_week" });
      }
    }

    if (action === "recommend_zones" && driverId && result.recommendations) {
      const validUntil = new Date(now.getTime() + 30 * 60 * 1000);
      
      await supabase
        .from("ai_recommendations")
        .update({ is_active: false })
        .eq("driver_id", driverId);

      for (const rec of result.recommendations) {
        await supabase.from("ai_recommendations").insert({
          driver_id: driverId,
          recommendation_type: "positioning",
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          zone_lat: rec.zone_lat,
          zone_lng: rec.zone_lng,
          predicted_demand: rec.predicted_demand,
          confidence_score: rec.confidence_score,
          valid_until: validUntil.toISOString(),
          is_active: true
        });
      }
    }

    if (action === "learn_routes" && result.new_routes) {
      for (const route of result.new_routes) {
        await supabase.from("learned_routes").insert({
          origin_name: route.origin_name,
          destination_name: route.destination_name,
          origin_lat: 4.05,
          origin_lng: 9.70,
          destination_lat: 4.06,
          destination_lng: 9.71,
          popularity_score: route.estimated_demand,
          is_trending: route.is_trending,
          trip_count: 1
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result, fromCache: false, provider: AI_PROVIDER }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-traffic-intelligence:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
