# Nextstep Recruitment — Website Redesign

Redesign of [nextsteprecruit.com](https://nextsteprecruit.com), built as a static prototype first, then ported to the existing WordPress + Elementor site.

## Stack

- Plain HTML / CSS / vanilla JavaScript (no build step, no framework)
- **GSAP + ScrollTrigger** for animations (loaded via CDN)
- **Cobe** for the WebGL globe in the hero (loaded via ESM CDN)
- **Hanken Grotesk** via Google Fonts

No `npm install` required. Everything is loaded at runtime.

## Run locally

The site uses ES modules (for Cobe), so it must be served from a local web server. Opening `index.html` directly with `file://` will not work.

### Option A — VS Code Live Server (easiest)
1. Install the **Live Server** extension by Ritwick Dey
2. Right-click `index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`
4. Edits to any file auto-reload the browser

### Option B — Python (no install)
```
python -m http.server 8000
```
Then open `http://localhost:8000`

### Option C — Node
```
npx serve
```

## Project structure

```
.
├── index.html                  # Main page
├── assets/
│   ├── css/
│   │   └── main.css            # All styles
│   └── js/
│       ├── main.js             # GSAP animations (classic script)
│       └── globe.js            # Cobe globe (ES module)
├── _private/                   # Gitignored — local-only notes
│   ├── overviews/
│   │   └── current-state.md    # Live "where are we" snapshot
│   └── session-logs/           # One file per working session
├── .gitignore
└── README.md
```

## Iteration workflow

We're building the page **section by section**, not all at once. Currently focused on the **hero**.

- See `_private/overviews/current-state.md` for what's done, pending, and key open decisions
- Session logs in `_private/session-logs/` capture what changed each session — paste the latest one into a new chat to give Claude continuity

## Eventual WordPress port

On completion, this build will be ported to a child theme of the existing Elementor site:

- Layout structure rebuilt as Elementor sections so the team can keep editing copy in the visual editor
- Each section gets a CSS class added via Elementor → Advanced → CSS Classes
- All animation JS attached to those classes from a single child-theme file (`assets/animations.js`)
- GSAP loaded site-wide via `wp_enqueue_script` in `functions.php`
- Cobe loaded as ESM only on pages that need it

## Brand quick reference

- **Primary**: `#FF6B35` (orange)
- **Accents**: `#FF8855` (warm orange), `#FFB347` (light orange), `#F5A623` (gold)
- **Ink**: `#141414`  ·  **Background**: `#FFFFFF`  ·  **Warm bg**: `#FAF7F2`
- **Type**: Hanken Grotesk (display 800, body 400/500)
- **Pink is not in the palette** — was a mistake earlier in iteration

## Contact

Working with Claude (Anthropic) for design + build. Production handoff to come.
