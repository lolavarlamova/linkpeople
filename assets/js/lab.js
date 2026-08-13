/* LinkPeople Lab — prototype-only access marker.
   NOT a security mechanism. Real access control will be enforced server-side
   (Vercel middleware + signed cookie) once payment is connected.
   This only keeps the preview tidy for internal review. */
(function () {
  "use strict";
  try {
    if (sessionStorage.getItem("lp_lab_preview") === "1") return;
    sessionStorage.setItem("lp_lab_preview", "1");
  } catch (e) { /* storage unavailable — do nothing */ }
})();
