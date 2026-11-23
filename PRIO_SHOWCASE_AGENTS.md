# Public Prio portfolio showcase

These files implement a separate, **fictional-data** public demo for the portfolio domain. They DO NOT point at the private Prio production application, its users, or its database. Keep existing portfolio home untouched.

## Agent design skill guidance

- `tasteskill.dev` is the site for [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill). Its principles: show real product UI; precise purpose-led copy; equal spacing edges; content-first sectioning; interaction as explanation, not decoration; 390px mobile check.
- [Emil Kowalski's skills](https://github.com/emilkowalski/skills) include `emil-design-eng`. Apply the source under `.agents/skills/emil-design-eng/`: 120–200ms control transitions, subtle press feedback, appropriate easing, focus states and reduced-motion support.
- The full Taste Skill has referenced `assets/`, `references/`, and `scripts/` beyond its markdown. Run `bash scripts/install-design-skills.sh` from this repo root to install the complete upstream skill. The base file is intentionally not copied alone and misrepresented as a complete working installation.

## Launch

Github Pages must publish the portfolio repo's root directory for `/prio/` and `/prio/demo.html` to work. The portfolio domain requires DNS and HTTPS configured separately.

Run the HTTP-based Playwright suite following the setup in `prio/README.md`.

No secret keys or production endpoints belong in this project.
