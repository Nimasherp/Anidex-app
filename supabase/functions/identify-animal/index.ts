import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req : Request) => {
  console.log("hello")
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400 }
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
    console.log(openaiKey)
    if (!openaiKey) throw new Error("Missing OPENAI_API_KEY")
    
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages }),
    })

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const visionResult = await visionResponse.json()
    const animalIdentification = visionResult.choices[0]?.message?.content

    return new Response(
      JSON.stringify({ identification: animalIdentification, found: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})
