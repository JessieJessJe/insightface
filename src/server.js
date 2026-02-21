import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic();

app.post("/api/interpret", async (req, res) => {
  const { fullShader, selectedLines, lineIndices } = req.body;

  const linesList = lineIndices
    .map((i, idx) => `Line ${i + 1}: ${selectedLines[idx]}`)
    .join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a GLSL shader expert. I've selected ${lineIndices.length} line(s) from this fragment shader:

\`\`\`glsl
${fullShader}
\`\`\`

The selected lines are:
\`\`\`
${linesList}
\`\`\`

Return a JSON object with exactly these fields:
1. "explanation": A brief, clear 1-3 sentence explanation of what these lines do together visually. Be specific about the visual effect.
2. "isolationShader": A complete, valid fragment shader that ISOLATES and VISUALIZES what these lines contribute together. The isolation shader should:
   - Be a complete fragment shader with void mainImage(out vec4 fragColor, in vec2 fragCoord)
   - Show the intermediate value or combined effect of these lines as a color output
   - Use the same uniforms (iResolution, iTime)
   - Be visually meaningful and interesting
   - If the lines compute a float, show it as a grayscale or colorized gradient
   - If they compute a vec2, show xy as rg
   - If they compute a vec3/vec4, show it directly as color
   - Keep it simple but visually clear

Return ONLY valid JSON, no markdown fences, no extra text:
{"explanation": "...", "isolationShader": "..."}`,
        },
      ],
    });

    const text = message.content[0].text;
    // Try to parse JSON, handling potential markdown fences
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    console.error("Interpret error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/variations", async (req, res) => {
  const { fullShader, paramValue, paramContext, lineIndex } = req.body;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a GLSL shader expert. In this fragment shader, the user clicked on the numeric value "${paramValue}" on line ${lineIndex + 1}:

\`\`\`glsl
${fullShader}
\`\`\`

The line context is: ${paramContext}

Suggest 3 meaningful variations of this parameter that would create visually distinct and interesting results. Each variation should produce a noticeably different visual effect.

Return ONLY valid JSON, no markdown fences:
{
  "paramName": "brief name of what this parameter controls",
  "variations": [
    {"label": "short 1-2 word label", "value": "new numeric value as string", "description": "what changes visually"},
    {"label": "short 1-2 word label", "value": "new numeric value as string", "description": "what changes visually"},
    {"label": "short 1-2 word label", "value": "new numeric value as string", "description": "what changes visually"}
  ]
}`,
        },
      ],
    });

    const text = message.content[0].text;
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    console.error("Variations error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`ShaderLens API running on port ${PORT}`));
