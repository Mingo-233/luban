# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Framework**: SolidJS (JSX, not TypeScript)
- **Bundler**: Vite 8 with @tailwindcss/vite plugin
- **Styling**: TailwindCSS v4 with custom liquid glass theme
- **Package Manager**: pnpm (use pnpm, not npm)

## Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server (port 8080, configurable in vite.config.js)
pnpm build          # Production build to dist/
pnpm preview        # Preview production build
docker build -t tool-site .   # Build Docker image
```

## Architecture

### Routing
This is a client-side SPA. Navigation uses `window.history` API (pushState/popstate). No router library is used. Routes are defined in `src/App.jsx` in the `tools` array.

### Lazy Loading
Tool pages use SolidJS `lazy()` + `Suspense` for code splitting. Each tool page is a separate chunk.

### Adding New Tools
1. Create a new page component in `src/pages/` (e.g., `NewTool.jsx`)
2. Add entry to the `tools` array in `src/App.jsx`:
   ```js
   { id: 'new-tool', path: '/new-tool', name: '新工具', desc: '描述', component: lazy(() => import('./pages/NewTool')) }
   ```
3. The component receives `props.navigate` and `props.tools`

### UI Theme
Liquid glass effects are in `src/index.css`:
- `.glass-card`: backdrop blur card
- `.glass-button`: translucent button with hover effects
- `.spinner`: loading indicator
- `.fade-in`: entrance animation

### Image Processing
All image tools use Canvas API for browser-side processing. No external image libraries.

## Key Files

- `src/App.jsx` - Main app with routing, lazy loading setup
- `src/index.css` - TailwindCSS imports + custom liquid glass styles
- `vite.config.js` - Vite + TailwindCSS + dev server config
- `Dockerfile` - Multi-stage build (node builder → nginx)
- `nginx.conf` - Nginx config with SPA routing fallback
