# insightface -- A New Renaissance

Very soon we might forget what coding is. Or maybe it becomes the new literature. The Sanskrit.
insightface is a live code-interpreting tool that lets humans explore a codebase with an AI agent in real time.

It is built around interpreting GLSL fragment shaders — through hovering, clicking, and selecting, users can explore parts of the code live, with AI interpretation and simulation in sandbox.
How we shattered UI conventions:

* It is reactive → code interpretation happens in real time. Hover a line, see what it does. 

* It is agentic → the agent has full context of the shader at all times. when intepreting a single line of code, it has context to the full codebase. making the intepration relatable.

Claude's unique reasoning:
Interpreting shader code is not autocomplete. To isolate what a single GLSL line does visually, Claude must reason about spatial math — how distance functions shape geometry, how values flow between lines, how a float becomes a color. It then writes a valid, compilable isolation shader from scratch. This requires genuine mathematical reasoning that weaker models cannot do reliably.

Tech Highlight:

* Claude API (Opus) — generates interpretation and isolation shaders per interaction, with structured JSON output for reliable UI rendering

* Client-side response caching — keeps the interface responsive and stable under rapid exploration, minimizing redundant API calls

* Parameter variations — users can click numeric values in the shader to explore AI-suggested alternative parameters with live visual previews

* React + Vite + Express — lightweight frontend and backend to stay out of the way of the interaction loop

UI Overview:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ◈ insightface                    Select to understand · Click to explore │
├────────────────────────────┬────────────────────────────────────────────┤
│                            │                                            │
│     CODE PANEL             │         RIGHT PANEL                        │
│                            │                                            │
│  1  precision highp float; │    ┌──────────────────────┐                │
│  2  uniform vec2 iRes...;  │    │                      │                │
│  3  uniform float iTime;   │    │    LIVE OUTPUT        │                │
│  4                         │    │    (main shader)      │                │
│  5  float sdSphere(...) {  │    │                      │                │
│ [6]   return length(p)-s;  │◄── select lines ──►      │                │
│  7  }                      │    │                      │                │
│  8                         │    └──────────────────────┘                │
│  9  void mainImage(...) {  │                                            │
│ [10]  vec3 col = 0.5;  ←── click number                                │
│  11   ...                  │    ┌──────────────────────┐                │
│  12 }                      │    │ WHAT THIS DOES        │                │
│                            │    │ "These lines compute  │                │
│  ┌─────────────────────┐   │    │  a signed distance…" │                │
│  │ Analyze 2 Lines  ×  │   │    ├──────────────────────┤                │
│  └─────────────────────┘   │    │ ISOLATED OUTPUT       │                │
│   (appears on selection)   │    │ ┌──────────────────┐ │                │
│                            │    │ │  isolation shader │ │                │
│                            │    │ │  (WebGL canvas)   │ │                │
│                            │    │ └──────────────────┘ │                │
│                            │    └──────────────────────┘                │
│                            │                                            │
│                            │    ┌──────────────────────┐                │
│                            │    │ VARIATIONS            │                │
│                            │    │ ┌────┐ ┌────┐ ┌────┐ │                │
│                            │    │ │0.3 │ │1.0 │ │2.5 │ │                │
│                            │    │ │    │ │    │ │    │ │                │
│                            │    │ └────┘ └────┘ └────┘ │                │
│                            │    │ (click to apply)      │                │
│                            │    └──────────────────────┘                │
└────────────────────────────┴────────────────────────────────────────────┘

INTERACTION FLOW:

  ① Select lines          Click lines (shift+click for range)
       │
       ▼
  ② Analyze button        Appears inline on last selected line
       │
       ▼
  ③ Claude (Opus)         POST /api/interpret → explanation + isolation shader
       │
       ├──► Explanation    "What this does" text panel
       └──► Isolation      Live WebGL preview of just those lines

  ① Click a number        Any numeric value in the shader
       │
       ▼
  ② Claude (Opus)         POST /api/variations → 3 alternative values
       │
       ▼
  ③ Variation cards       Each with a live shader preview; click to apply
```

Future:

* Streaming interpretation — stream Claude's responses in real time instead of waiting for full completion, for a more fluid exploration experience

* Debounced hover triggers — trigger lightweight analysis on hover with debouncing, enabling passive exploration without explicit clicks
