# Landscape redesign

The home page follows a mountain-lake reference: a full-viewport photograph with a restrained overlay, centered headline, and a clear invitation to start or resume the next lesson. The course remains directly below the photograph. The downward arrow scrolls to the program without changing the application's hash route.

Inside the course, warm white surfaces and forest-green accents keep long explanations, diagrams, quiz feedback, and account forms readable. Navigation lives in the top header and an on-demand chapter drawer, rather than a permanent dashboard sidebar.

## Accessibility and performance

- The decorative photograph has empty alternative text; the headline and primary action are real HTML.
- The image is served locally (approximately 834 KB); no third-party font or image requests are required.
- Reduced-motion preferences disable entrance and arrow animations and smooth scrolling.
- The closed drawer is inert. Opening it focuses the close button and makes the page behind it inert; Escape closes it and returns focus to the menu button.
- Mobile navigation, auth forms, quiz controls, and reading views retain their existing functionality.
- No API contract, database migration, curriculum, account data, or progress calculation changed.

## Verification

Production build and TypeScript checks passed. All 19 existing tests passed against local Wrangler, including account lifecycle, progress persistence, ownership, grading, and recovery. Browser checks covered desktop and 390 px mobile layouts, the program scroll action, lesson navigation, a 100% guest quiz result, drawer/Escape behavior, and the account dialog. Updated home screenshots are in `docs/screenshots/`.

Photo: Alec Olson, https://unsplash.com/photos/OCGXUCCQblw, under the Unsplash License. Photography is separate from the repository's MIT-licensed code.
