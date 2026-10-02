# Security policy

Please do not post credentials, session cookies, recovery codes, or private user data in a public issue. Report a vulnerability through the repository's private vulnerability reporting feature if enabled; otherwise contact the maintainer through their GitHub profile without including exploit secrets publicly.

## Controls

- Passwords: per-account random salt, PBKDF2-HMAC-SHA-256, versioned 100,000-iteration parameters (the Workers Web Crypto runtime ceiling). This is below OWASP's general PBKDF2 recommendation; the long-password requirement and online throttling do not eliminate the offline-cracking tradeoff. Revisit a managed identity provider or stronger supported KDF before operating a high-risk service.
- Sessions: random 256-bit tokens; only SHA-256 digests stored; `HttpOnly`, `SameSite=Strict`, `Secure` in HTTPS production; 30-day expiration; server revocation on logout/recovery.
- Recovery: random 192-bit one-use recovery code; only digest stored; conditional update prevents concurrent reuse; successful recovery invalidates older sessions.
- Data access: owner derived from authenticated session; parameterized SQL; no client-provided owner IDs or scores are trusted.
- Request protection: exact same-origin checks on POST, JSON-only writes, bounded 16 KiB input, IP/account login throttles, per-user assessment throttles, security headers.

## Boundaries

This is an educational personal project, not an independently audited identity platform. Email ownership is **not verified**, email reset and MFA are not implemented, and registration is public. Recovery requires the saved code. Course questions and explanations are public source material: this is not a secure certification or proctoring system. Grading on the server prevents arbitrary score submission, not looking up the answers.

The database contains email, display name, password hash/salt, recovery digest, session digests, progress and attempts. No advertising analytics or tracking cookies are used. Expired sessions and throttle records are cleaned on successful sign-in. User deletion/export is currently a maintainer operation; no self-service privacy console is implemented.

Do not put unrelated sensitive information in the app. Keep runtime/dependencies updated, monitor quota, and review Cloudflare backup/restore retention for the active plan.
