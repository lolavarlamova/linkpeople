/* Structured content for LinkPeople.
   Kept as data so it can be reused/extended without duplicating markup. */

window.LP = window.LP || {};

/* Functional role directory (used on Home role selector + Expertise page) */
window.LP.roleGroups = [
  {
    id: "product",
    label: "Product, Technology & Data",
    roles: ["CTO", "Head of Product", "Product Manager", "Software Engineer", "Data Analyst", "Business Analyst", "UX/UI Designer", "QA Manager"],
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    roles: ["CMO", "Head of Marketing", "Performance Marketing Manager", "CRM Manager", "Retention Manager", "SEO Manager", "Partnerships Manager", "Marketing Analyst"],
  },
  {
    id: "operations",
    label: "Operations & Customer Experience",
    roles: ["COO", "Operations Manager", "Customer Success Manager", "Customer Support Lead", "Payments Operations Manager", "Project Manager"],
  },
  {
    id: "finance",
    label: "Finance, Risk & Compliance",
    roles: ["CFO", "Finance Manager", "Treasury Manager", "Risk Manager", "Compliance Manager", "Fraud Prevention Specialist", "AML/KYC Specialist"],
  },
  {
    id: "leadership",
    label: "Leadership & People",
    roles: ["General Manager", "Country Manager", "HR Director", "HR Business Partner", "Talent Acquisition Lead"],
  },
];

/* Insights index — no fabricated authors/dates. Add real entries later. */
window.LP.insights = [
  {
    category: "Hiring",
    title: "How to Structure a Hiring Process for a Scaling Company",
    summary: "A practical framework for turning an ad-hoc hiring approach into a repeatable, senior-quality process.",
    slug: "structuring-a-hiring-process",
  },
  {
    category: "Hiring",
    title: "When to Use Retained Search",
    summary: "How to decide between contingency and retained search based on role criticality, confidentiality and market scarcity.",
    slug: "when-to-use-retained-search",
  },
  {
    category: "People Operations",
    title: "Fractional HR vs a Full-Time HR Director",
    summary: "What each model gives a growing company — and how to choose the right level of people leadership for your stage.",
    slug: "fractional-hr-vs-full-time-hr-director",
  },
];

window.LP.insightCategories = ["Hiring", "Leadership", "People Operations", "Compensation", "Growth Teams", "International Recruitment"];
