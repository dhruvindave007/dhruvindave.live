# Prio — public portfolio showcase

A standalone static landing page and interactive browser demonstration for the portfolio at `dhruvindave.live/prio/`.

## Architecture and privacy

- All HTML/CSS/JS is in this directory. No build step, backend, authentication, production credentials, or API requests.
- `demo.html` operates on **fictional** tasks, employees, and approvals. Changes persist locally in the browser using `localStorage`, and Reset restores the samples. The sample-data label must remain conspicuous.
- This is **not** the production Prio app. The real Prio application is hosted separately and needs authorization.
- Public links deliberately avoid Intuitive's internal Prio deployment.

## Hosting

This folder belongs in the GitHub Pages source repository `dhruvindave007/dhruvindave.live` under `/prio/`, preserving `CNAME` and the existing homepage. If GitHub Pages is configured to publish the default branch root, the URLs are:

- `https://dhruvindave.live/prio/`
- `https://dhruvindave.live/prio/demo.html`

DNS/TLS must be configured independently; publishing these files does not repair a broken custom domain.

## Testing

From the repository's root, serve statically: `python -m http.server 8000`. Test `http://localhost:8000/prio/` and `/prio/demo.html`.

Use Playwright against Chromium at 390×844, 768×1024, and 1440×900 for layout and interactions, including task completion, filtering, creating and resetting tasks, approval decisions, keyboard Escape, and no horizontal overflow. Do not point browser tests at the internal production app.

## Design references

- https://tasteskill.dev and https://github.com/Leonxlnx/taste-skill — product-led visual storytelling, equal edges, specific copy, real UI, restrained effects, mobile first.
- https://github.com/emilkowalski/skills — tight controls and feedback, named transitions, accessible motion and reduced-motion support.
- Existing Prio UI: calm, clean layout with blue accents. This public page is designed to complement, not replace, that product.
