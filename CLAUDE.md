# disaster-handbook

Taiwan Family Emergency Handbook Generator — personalized disaster preparedness PDF for Taiwan families.

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- @react-pdf/renderer v4 for client-side PDF generation
- Leaflet + html-to-image for map capture
- Deployed on Vercel (auto-deploy from GitHub)

## Commands
```bash
npm install --legacy-peer-deps   # install dependencies
npm run dev                       # start dev server on port 3000
npm run build                     # production build
npm run test                      # run tests with vitest
```

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
