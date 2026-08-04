/* =========================================================================
   LinkPeople — Opportunities data source (single source of truth)
   -------------------------------------------------------------------------
   This is the ONLY place opportunities are defined. The Opportunities page,
   any per-role page (/opportunities/<slug>), the sitemap and the JobPosting
   structured data all read from here. There is NO CMS and NO database — add a
   real role by adding one object below, following the schema.

   DO NOT add demo, sample or fictional vacancies to production.
   Only objects with status "live" are ever shown publicly.

   Schema (see OPPORTUNITIES.md for the full "add a real role" checklist):
   {
     slug:            "head-of-payments-operations", // URL segment (kebab-case, unique)
     title:           "Head of Payments Operations",
     department:      "Payments Operations",         // functional area
     location:        "Remote (EU time zones)",      // real location text
     workFormat:      "Remote",                      // Remote | Hybrid | On-site
     employmentType:  "FULL_TIME",                   // schema.org value, or "" if N/A
     seniority:       "Head of Function",
     summary:         "One line shown on the card.",
     description:     "Full overview. Plain text; line breaks with \n.",
     responsibilities:["…", "…"],
     requirements:    ["…", "…"],
     preferred:       ["…"],                          // optional
     languages:       ["English — fluent"],           // optional
     compensation:    "",                             // optional; only if genuinely public
     applyMethod:     "form",                          // "form" (Talent Network) | "mailto:…" | "https://…"
     published:       "2026-08-04",                    // ISO date, real
     closing:         "",                              // ISO date, or "" if none
     status:          "live",                          // draft | live | closed
     featured:        false,
     seoTitle:        "",                              // optional override
     seoDescription:  ""                               // optional override
   }
   ========================================================================= */

window.LP = window.LP || {};

window.LP.opportunities = [
  // No public searches are currently listed. Add real, live roles here only.
];

/* Only "live" roles are ever public. */
window.LP.liveOpportunities = function () {
  return (window.LP.opportunities || []).filter(function (o) { return o && o.status === "live"; });
};

window.LP.getOpportunity = function (slug) {
  var all = window.LP.opportunities || [];
  for (var i = 0; i < all.length; i++) { if (all[i] && all[i].slug === slug) return all[i]; }
  return null;
};
