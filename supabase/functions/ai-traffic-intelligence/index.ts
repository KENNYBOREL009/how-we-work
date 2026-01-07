import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, driverId, driverLocation } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all relevant data
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

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

    // Build AI prompt based on action
    let systemPrompt = `Tu es un expert en analyse de trafic urbain à Douala, Cameroun. 
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

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "traffic_analysis",
              description: "Analyse du trafic et recommandations",
              parameters: responseSchema
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "traffic_analysis" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Store results in database based on action
    if (action === "predict_traffic" && result.predictions) {
      // Update traffic patterns
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
      // Store recommendations for driver
      const validUntil = new Date(now.getTime() + 30 * 60 * 1000); // 30 min validity
      
      // Deactivate old recommendations
      await supabase
        .from("ai_recommendations")
        .update({ is_active: false })
        .eq("driver_id", driverId);

      // Insert new recommendations
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
          origin_lat: 4.05, // Default Douala center
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
      JSON.stringify({ success: true, data: result }),
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
