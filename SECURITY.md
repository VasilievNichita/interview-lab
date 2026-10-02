# Security policy

Please do not post credentials, session cookies, recovery codes, or private user data in a public issue. Report a vulnerability through the repository's private vulnerability reporting feature if enabled; otherwise contact the maintainer through their GitHub profile without including exploit secrets publicly.

## Controls

- Profiles: name and race are display preferences, never authentication credentials. A new profile receives a random 256-bit transfer code; only its SHA-256 digest is stored in D1. Codes are reusable across devices and can be replaced in the profile panel. Replacement blocks future use of the old code; it does not terminate already-issued sessions.
- Browser persistence: the transfer code is stored in localStorage for automatic restoration after session expiration. This makes same-origin XSS and access to the browser profile important risks. Keep a private copy before clearing browser data. User/AI text is rendered as text, with a restrictive CSP and no third-party runtime scripts.
- Passwords: per-account random salt, PBKDF2-HMAC-SHA-256, versioned 100,000-iteration parameters (the Workers Web Crypto runtime ceiling). This is below OWASP's general PBKDF2 recommendation; the long-password requirement and online throttling do not eliminate the offline-cracking tradeoff. Revisit a managed identity provider or stronger supported KDF before operating a high-risk service.
- Sessions: random 256-bit tokens; only SHA-256 digests stored; `HttpOnly`, `SameSite=Strict`, `Secure` in HTTPS production; 30-day expiration; server revocation on logout/recovery.
- Legacy recovery: the old password-recovery endpoint consumes a 192-bit recovery code, rotates it and revokes old sessions. The new transfer endpoint also accepts existing legacy codes but does not consume them. Legacy password endpoints remain for compatibility; they are absent from the new UI.
- Data access: owner derived from authenticated session; parameterized SQL; no client-provided owner IDs or scores are trusted.
- Request protection: exact same-origin checks on POST, JSON-only writes, bounded 16 KiB input, IP/account login throttles, per-user assessment throttles, security headers.

## Boundaries

This is an educational personal project, not an independently audited identity platform. Profile creation is public. New profiles do not collect email or password; legacy email ownership was never verified. Email reset and MFA are not implemented. Recovery requires browser access or the saved code. Course questions and explanations are public source material: this is not a secure certification or proctoring system. Grading on the server prevents arbitrary score submission, not looking up the answers.

The database contains display name, race, transfer digest, session digests, progress and attempts. Existing email/password fields remain for compatibility; new profiles use a synthetic `.invalid` address and inaccessible random password data. No advertising analytics or tracking cookies are used. Expired sessions and throttle records are cleaned on successful sign-in. User deletion/export is currently a maintainer operation; no self-service privacy console is implemented.

Mentor questions and selected public course excerpts are sent to Cloudflare Workers AI. Profile names, transfer codes and progress are not included in the model prompt. The app does not persist conversations. The API limits each question to 800 characters, output to 1,000 tokens, each profile to 20 requests/hour and all inference attempts to 60/day. These controls reduce accidental usage; they are not a substitute for provider free-plan enforcement. On failure or quota exhaustion, the response explicitly identifies course material instead of claiming AI or web search.

Do not put unrelated sensitive information in the app. Keep runtime/dependencies updated, monitor quota, and review Cloudflare backup/restore retention for the active plan.
