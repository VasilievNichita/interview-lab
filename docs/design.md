# Moonlit forest design

The interface uses a dark fantasy forest atmosphere: a moonlit mountain lake, dense pine silhouettes, silver mist, deep green surfaces, and serif headings. Long lesson text stays in a familiar sans-serif font with high-contrast pale ink.

The original artwork is reused as a short panoramic banner on lessons, quizzes, chapters, practice and progress pages. Subtle image treatments also appear in exam and practice panels. The home page retains its full-viewport hero and a direct route to the next lesson.

## Mist interaction

Buttons and navigable course cards have a decorative CSS `::before` layer made of blurred radial gradients. On hover (pointer devices) or keyboard focus, it rises and fades over a 2.8 second cycle. The layer is behind the text and ignores pointer events. Background and text colors switch together to dark ink on a pale green surface, preventing a white-on-white intermediate frame. Disabled buttons do not animate. Reduced-motion preferences disable the mist animation entirely. Touch devices keep normal, readable surfaces without sticky hover effects.

## Artwork

- Workspace asset: `public/images/mist-lake.jpg`.
- Generated with the built-in image generation tool; no external image service is contacted by visitors.
- JPEG compressed at quality 88 from the generated PNG; the original output is retained outside the repository.
- The earlier Unsplash asset is retired from the live bundle and remains available in Git history.

Final generation prompt:

> Create a cinematic dark fantasy forest landscape for a premium learning website hero, landscape 16:9. An ancient dense evergreen forest surrounds a still dark emerald lake, jagged mountain silhouettes disappear into moonlit mist. Left foreground: towering black pine trees and mossy rocky shoreline; right: layers of forest and distant mountains. Subtle ethereal silver green fog rising over the water, delicate cold moonlight through clouds, faint stars. Atmospheric, mysterious, contemplative, sophisticated painterly realism with rich natural detail. Deep pine green, midnight teal, charcoal, muted silver. Readable landscape with visible forest details, not pitch black. Broad quiet middle area for website headline. NO text, logos, people, creatures, buildings, boats, neon lights, glowing mushrooms, or horror gore. Not daylight, not sunrise. Image only.

## Validation

TypeScript and production build passed. Browser review covered the desktop hero, lesson banner and reading surface, keyboard-triggered mist (including computed animation and final foreground/background colors), and mobile home and quiz pages at 390 px without horizontal overflow. Screenshots: `docs/screenshots/desktop.jpg`, `mobile.jpg`, and `lesson.jpg`.

No API contract, database schema, lesson content or saved progress changed. Existing commit history is preserved; the new theme and documentation are separate commits authored by Vasiliev Nichita.
