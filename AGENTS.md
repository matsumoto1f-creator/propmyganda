# Project Architecture Rules

- Production builds must fall back to the project's public Lovable Cloud URL and publishable key when injected Vite variables are absent, because missing values crash the entire public site before React mounts.
- The home page is the 3D hub in `src/hub` (read `src/hub/README.md` before changing it). Its content is built from the same files and tables as the other pages, so do not hardcode copy into it. Keep every rule in `src/hub/hub.css` under `.pmg-hub`, and keep the hub on `three-hub` (three r187): PropWorld and PMG Fight stay on the site's `three` (r160). After any change to it run `npm test`, `npm run build` and `node scripts/hub-check.mjs`.
