# Publishing a real opportunity

The site has **no CMS and no database**. Opportunities are plain data in
`assets/js/opportunities.js` plus one static page per role. Only roles with
`status: "live"` are ever shown publicly.

**Never publish a demo, sample or fictional vacancy.** Do not invent employer
names, salary, location, contract type or dates.

## Add a live role

1. **Add the data.** In `assets/js/opportunities.js`, add one object to
   `window.LP.opportunities` following the schema documented at the top of that
   file. Set real values and `status: "live"`.

2. **Create the page.** Copy the template to the slug filename:

   ```bash
   cp opportunities/_template.html opportunities/<slug>.html
   ```

   In the new file: set `data-slug="<slug>"` on `#opportunityDetail`, and set the
   `<title>`, `<meta name="description">` and canonical `.../opportunities/<slug>`.
   For best SEO, also replace the fallback markup inside `#opportunityDetail` with
   the real role content (title, overview, responsibilities, requirements). `main.js`
   hydrates the same content from the data entry and injects the **JobPosting**
   structured data automatically for live roles.

3. **Add to the sitemap.** Add
   `https://www.linkpeople.agency/opportunities/<slug>` to `sitemap.xml`.

4. Commit and push. Vercel deploys automatically.

## Statuses

| status  | public page | listed on /opportunities | in sitemap | JobPosting |
|---------|-------------|--------------------------|------------|------------|
| `draft` | redirects to /opportunities | no | no (remove it) | no |
| `live`  | full role page | yes | yes | yes |
| `closed`| "Applications closed" + `noindex` | no | remove it | no |

`main.js` enforces the `draft` redirect and the `closed` / `noindex` behaviour at
runtime; keeping the sitemap in sync is manual (see steps above).

## Talent Network

The **Join the LinkPeople Talent Network** card on `/opportunities` is permanent
and always appears first. It is **not** a vacancy and must never carry JobPosting
structured data.
