import { NextResponse } from "next/server";

/**
 * Condition Judge API
 *
 * You provide: a condition description + either imageBase64 OR imageUrl.
 * The package judges whether the condition is met.
 *
 * - conditionDescription: what must be verified (required)
 * - imageBase64: raw image data (optional)
 * - imageUrl: URL to an image (optional) — we fetch and judge from URL.
 *   No file upload needed — just paste a link.
 *
 * Set OPENAI_API_KEY in .env for real AI. Without it, returns demo stub.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, conditionDescription } = body;

    if (!conditionDescription?.trim()) {
      return NextResponse.json(
        { error: "Condition description is required" },
        { status: 400 }
      );
    }

    let imageData: string | null = imageBase64?.trim() || null;

    // If URL provided instead of base64, fetch and convert
    if (!imageData && imageUrl?.trim()) {
      try {
        const res = await fetch(imageUrl.trim());
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const contentType = res.headers.get("content-type") || "image/jpeg";
        imageData = `data:${contentType};base64,${base64}`;
      } catch (err) {
        return NextResponse.json(
          { verified: false, note: `Could not fetch image from URL: ${err instanceof Error ? err.message : "Unknown"}` },
          { status: 500 }
        );
      }
    }

    const hasImage = !!imageData;

    if (process.env.OPENAI_API_KEY && hasImage && imageData) {
      const result = await verifyWithOpenAI(process.env.OPENAI_API_KEY, imageData, conditionDescription);
      return NextResponse.json(result);
    }

    // Demo stub: no image = no verdict; image/URL = assume helps
    const stubResult = {
      verified: hasImage,
      note: hasImage
        ? `[Demo] Image provided. Add OPENAI_API_KEY for real AI verification of: "${conditionDescription}"`
        : `[Demo] Provide imageUrl or imageBase64 for the judge to verify: "${conditionDescription}"`,
    };
    return NextResponse.json(stubResult);
  } catch (err) {
    console.error("Verify condition error:", err);
    return NextResponse.json(
      { error: "Verification failed", verified: false },
      { status: 500 }
    );
  }
}

async function verifyWithOpenAI(
  apiKey: string,
  imageBase64: string,
  conditionDescription: string
): Promise<{ verified: boolean; note: string }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a verification assistant. Look at this image and determine if the following condition is met. Reply with JSON only: {"verified": true or false, "note": "brief explanation"}\n\nCondition to verify: ${conditionDescription}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    return {
      verified: !!parsed.verified,
      note: parsed.note || "AI verification completed",
    };
  } catch {
    return {
      verified: false,
      note: `AI response could not be parsed: ${content.slice(0, 100)}`,
    };
  }
}
