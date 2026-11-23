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

Run the same suite as CI from the portfolio repository root:

```sh
python -m pip install -r prio/tests/requirements.txt
python -m playwright install --only-shell chromium
PRIO_SCREENSHOT_DIR=/tmp/prio-screens python prio/tests/test_ui.py
```

The suite starts its own local HTTP server and loads the same assets and URLs as the public site. The screenshots directory is optional. CI uploads viewport screenshots and captures a failure screenshot when a page assertion fails. Linux CI installs Chromium system dependencies with `--with-deps`.

Chromium checks cover widths of 360, 390, 768, 1024, and 1440 pixels. They exercise the launch links, touch and keyboard controls, modal focus, Escape and pointer dismissal, reduced motion, filtering, task and approval actions, persistence, reset, and recovery from invalid saved data.

## Design references

- https://tasteskill.dev and https://github.com/Leonxlnx/taste-skill — product-led visual storytelling, equal edges, specific copy, real UI, restrained effects, mobile first.
- https://github.com/emilkowalski/skills — tight controls and feedback, named transitions, accessible motion and reduced-motion support.
- Existing Prio UI: calm, clean layout with blue accents. This public page is designed to complement, not replace, that product.
