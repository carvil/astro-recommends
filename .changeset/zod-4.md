---
"astro-recommends": patch
---

Bump runtime dep `zod` from 3.25.76 to 4.4.2.

No API changes. Our schema usage avoided the v4 breaking-change surface — we don't use `.email()` (now its own schema), `z.record()` was already in the two-argument form, and our `.refine()` callbacks use the position-1-only signature. Empirically verified: typecheck + 39/39 tests + dogfood-site build (71 affiliate redirects, byte-identical output) all green against zod 4.4.2.
