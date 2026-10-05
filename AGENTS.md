# Agent rules

- The game is a plain Vite + vanilla JS canvas app (src/main.js, src/style.css); keep it framework-free because the user reset the repo to this structure.
- Rendering is a hand-written pseudo-3D projection on a 2D canvas (ground plane + depth-sorted billboards); keep it dependency-free so it runs on low-end phones.
- package.json must keep a `build:dev` script and tsconfig.json must exist (allowJs, noEmit) because the platform build runs both.
