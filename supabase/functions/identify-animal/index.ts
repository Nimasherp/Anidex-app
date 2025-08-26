import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// I decided to make all errors 200 because of an error message I kept having.
serve(async (req : Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! 
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ data: null, error: "No image provided" }),
        { status: 200}
      )
    }

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            // here I decided to only get the Common/Vernacular name (for now)
            text: "What animal is in this image? Please provide only the common/vernacular name in this format: Common Name. For example: Red Fox",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }, // here it uses the superbase storage (nice)
          },
        ],
      },
    ]
    // The open ai key is also stored in supabase
    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ data: null, error: "Missing OPENAI_API_KEY" }),
        { status: 200 }
      )
    }
    
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages }),
    })

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      return new Response(
        JSON.stringify({ data: null, error: `OpenAI API error: ${errorText}` }),
        { status: 200}
      )
    }

    const visionResult = await visionResponse.json()
    const animalIdentification = visionResult.choices[0]?.message?.content

    // Now let's search in our database :

    const { data, error } = await supabase
      .from("vernacular_names")
      .select("*")
      .eq("vernacularName", animalIdentification.toLowerCase())
      .limit(1)

      if (error) {
        return new Response(
          JSON.stringify({ data: null, error: error.message, identification: animalIdentification }),
          { status: 200 }
        )
      }

    const found = data !== null

    return new Response(
      JSON.stringify({ data, error: null, identification: animalIdentification }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("Error in identify-animal function:", err)
    return new Response(
      JSON.stringify({ data: null, error: err.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
})
