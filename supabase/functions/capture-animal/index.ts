import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"



serve(async (req : Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      )
    }

    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {data: { user }, error: userError} = await supabaseAuthClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401 }
      )
    }

    const { animalId, photoUrl, captureLocation } = await req.json()

    if (!animalId || !photoUrl || !captureLocation) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      )
    }

    const { data: existing, error: findError } = await supabase
      .from("user_collection")
      .select("*")
      .eq("user_id", user.id)
      .eq("taxon_id", animalId)
      .maybeSingle()

    if (findError) throw findError

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Animal already in collection" }),
        { status: 409 }
      )
    }

    const { data: newEntry, error: insertError } = await supabase
      .from("user_collection")
      .insert([
        {
          user_id: user.id,
          taxon_id: animalId,
          photo_url: photoUrl,
          latitude: captureLocation.x,
          longitude: captureLocation.y,
        },
      ])
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, collection: newEntry }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Capture error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to capture animal", details: error.message }),
      { status: 500 }
    )
  }
})
