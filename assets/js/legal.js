/* =========================================================================
   LinkPeople — central legal configuration (single source of truth).
   -------------------------------------------------------------------------
   Exact registered operator details are a LAUNCH DEPENDENCY: the fields set to
   null below MUST be filled with real values before relying on them publicly.
   Until then, the legal pages describe the business as
   "a Ukrainian individual entrepreneur operating under the LinkPeople brand".
   Do NOT print raw placeholder strings (e.g. "YOUR LEGAL NAME") on the site.
   ========================================================================= */
window.LP = window.LP || {};

window.LP.legal = {
  legalOperatorName: null,     // exact registered name of the entrepreneur — REQUIRED before launch
  tradingName: "LinkPeople",
  registrationCountry: "Ukraine",
  registrationDetails: null,   // individual-entrepreneur registration details — REQUIRED before launch
  legalContactEmail: "hello@linkpeople.agency",
  privacyContactEmail: "privacy@linkpeople.agency",
  descriptor: "a Ukrainian individual entrepreneur operating under the LinkPeople brand",
  lastUpdated: "4 August 2026" // change deliberately when the legal texts change — not per deploy
};
