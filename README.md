# LinkPeople

Premium multi-page marketing site for **LinkPeople** — a boutique recruitment & HR advisory
partner for fast-growing digital businesses (FinTech & Payments, SaaS & Technology,
E-commerce & Digital Platforms, Performance Marketing & Growth).

## Stack
Buildless **static site**: semantic HTML + one shared CSS design system + minimal vanilla JS.
No framework, no build step, no dependencies. Deploys to Vercel as static files.

## Structure
- `index.html`, `services.html`, `industries.html`, `expertise.html`, `about.html`,
  `insights.html`, `contact.html`, `talent-network.html`, `privacy.html`, `terms.html`
- `assets/css/styles.css` — design tokens + layout + all components
- `assets/js/data.js` — structured content (role directory, insights)
- `assets/js/main.js` — header, mobile nav, tabs, connections visual, reveals, form validation
- `assets/favicon.svg`, `robots.txt`, `sitemap.xml`, `vercel.json` (clean URLs)

## Local preview
Any static server works. Clean URLs (`/services`) need a server that maps extensionless paths
to `.html` (Vercel does this via `vercel.json` `cleanUrls: true`). Example with Python:
`python3 -m http.server` serves files (use `/services.html` locally), or use a clean-URL dev server.

## Forms
`contact.html` and `talent-network.html` validate fully client-side. Submission is handled by a
small adapter in `main.js`. **No backend is connected yet:** set `FORM_ENDPOINT` in `main.js`
(Formspree / Resend / your API) to enable real submissions. Until then, submissions are **not**
sent or faked — the form offers a prefilled `mailto:` fallback. File uploads require a real
backend (the mailto fallback cannot attach files).

## To review before launch
- `privacy.html`, `candidate-privacy.html` and `terms.html` are concise interim notices describing
  current behaviour. They have **not** been reviewed by a lawyer — a final review by a qualified
  professional is recommended.
- **Launch dependency:** exact registered operator details in `assets/js/legal.js`
  (`legalOperatorName`, `registrationDetails`) are `null`. Until provided, pages describe the
  business as "a Ukrainian individual entrepreneur operating under the LinkPeople brand".
- Ensure the `privacy@linkpeople.agency` mailbox/alias exists in Google Workspace (used for data requests).
- Canonical/base domain is `https://www.linkpeople.agency` (apex redirects to www).
- Add real roles via `OPPORTUNITIES.md`. Never publish demo vacancies.

## Deployment
Static — deploy the folder to Vercel (or any static host). `vercel.json` enables clean URLs.
