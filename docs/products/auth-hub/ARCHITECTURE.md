Architecture Specification: The "Silent Auth Hub"
Model: Multi-Tenant Centralized Identity Provider with Proxy-Based Secure Sessions.

1. System Components
   A. The Auth Hub (://youragency.com)
   Engine: Convex + BetterAuth.
   Responsibility: The only service that writes to the users and memberships tables.
   UI: A "Universal Login Page" that dynamically themes itself based on the ?tenant=slug query parameter.
   Tokens: Issues RS256 signed JWTs (Private Key stays here).
   B. The Client Apps (://bakery.com, ://gym.com)
   Responsibility: UI and business logic.
   Security: Holds the Public Key to verify JWTs locally.
   Proxy: A backend route (/api/auth/\*) that pipes requests to the Hub to handle HttpOnly cookies across domains.
2. Data & Security Schema
   Convex Schema
   tenants: Stores slug, brandingConfig (JSON: colors, logo), and allowedMethods (MFA, Social).
   memberships: Links userId + tenantId + role.
   refresh_tokens: Database-backed list of active sessions for instant revocation.
   Token Strategy (The Two-Cookie System)
   Access Cookie (at): HttpOnly, Secure, SameSite=None. Short-lived (15 min). Contains user metadata + tenantId.
   Refresh Cookie (rt): HttpOnly, Secure, SameSite=None. Long-lived (30 days). Used only by the Hub to rotate the Access Cookie.
3. The Authentication Lifecycle
   Phase 1: Branded Login
   User clicks "Login" on bakery.com.
   App redirects to ://youragency.com.
   Hub fetches bakery branding from Convex and renders a 100% matched UI.
   User completes Auth (Email OTP, SMS, or Social).
   Hub sets at and rt cookies on youragency.com and redirects back to bakery.com.
   Phase 2: Local Verification (Zero Latency)
   User makes a request to ://bakery.com.
   The Bakery backend middleware reads the at cookie from the request.
   Local Check: The backend verifies the JWT signature using the Public Key.
   Tenant Guard: The backend ensures the tenantId in the JWT matches "bakery."
   Result: Request processed. No network call to the Auth Hub was made.
   Phase 3: Silent Refresh
   When the at cookie expires, the Local Check fails.
   The Bakery app's middleware automatically proxies a request to ://youragency.com.
   The Hub verifies the rt cookie against the database.
   If valid, the Hub returns a new at cookie.
   The user experience is uninterrupted.
4. Implementation Roadmap
   Step 1: The Identity Core (Convex)
   Deploy Convex and implement the tenants and memberships tables.
   Configure BetterAuth with the Organization and Two-Factor plugins.
   Generate an RS256 Key Pair. Store the Private Key in Convex Environment Variables.
   Step 2: The Universal Login (Auth Hub UI)
   Build a Next.js app on ://youragency.com.
   Create a layout.tsx that fetches branding from Convex via the tenant slug.
   Implement the "Redirect Dance" logic to return users to their origin apps.
   Step 3: The Client Starter Kit
   Create a reusable middleware for client apps (Next.js/Node).
   Add the JWT Verification Logic using a library like jose.
   Add the Proxy Route (/api/auth/[...path]) using http-proxy-lite or similar to forward cookies securely.
5. Why this wins for you
   Security: HttpOnly cookies keep tokens out of reach from XSS scripts.
   Performance: Local JWT decryption means your Auth Hub won't slow down client apps.
   Scalability: Adding Client #50 is as easy as adding Client #1—just a database row and a new domain in your OAuth whitelist.

This is the "aha!" moment of the architecture. You are right to be skeptical—browsers strictly forbid bakery.com from reading cookies set on youragency.com.
The cookies never actually "move" to bakery.com. They stay on your Auth Hub domain, and we use a Backend Proxy to trick the browser into sending them.

## The "Magic" involves two steps:## 1. The Initial Hand-off (The Redirect)

After the user logs in at auth.youragency.com, the Hub doesn't just say "Goodbye." It redirects the user back to the client app with a one-time setup code in the URL.

- URL: https://bakery.com
- The Action: The bakery’s backend receives this code, calls your Auth Hub internally to exchange it for the real tokens, and then the bakery’s own backend sets the cookies on bakery.com.

OR (The cleaner way for your setup):

## 2. The Proxy Strategy (The "Mirror")

You set up a route inside the Bakery app code that acts as a "window" into the Auth Hub.

- Client App Route: ://bakery.com[...path]
- The Proxy Logic: When the frontend calls this route, the Bakery backend forwards the request to auth.youragency.com.

## This is the key: Because the browser thinks it is talking to bakery.com, you can set the cookies on the Bakery domain.

## Let’s trace the "Cookie Path":

1.  Login Page: User is at auth.youragency.com. They log in.
2.  Success: The Hub redirects the user back to ://bakery.com.
3.  The Drop-off: Your Bakery backend receives that request, communicates "server-to-server" with the Auth Hub to get the user's JWT, and then the Bakery backend issues the Set-Cookie command.
4.  Result: The browser saves the HttpOnly cookie under the name ://bakery.com.

## Why this is better:

- The Browser is Happy: It sees bakery.com setting a cookie for bakery.com. No "Third-Party Cookie" blocks.
- The Auth Hub is Happy: It only had to verify the user once.
- The JWT is Happy: It is now sitting securely in a cookie that only the Bakery backend can read, but because it was signed by your Auth Hub's Private Key, the Bakery backend knows it can trust it.

## In short:

The cookies don't "find their way over." Your Bakery App's backend creates them locally based on the "permission" granted by the Auth Hub during the login redirect.
Does the "Server-to-Server exchange" part make sense, or should we look at the specific code that handles that callback?

Switching to OIDC with a separate application backend actually makes your HttpOnly secure cookies even more powerful. Instead of the browser trying to juggle tokens, your backend acts as a "Guardian" that manages them for you.
This pattern is known as the Backend for Frontend (BFF) pattern. [1, 2]

## How the Cookie Experience Changes

In the previous "Shared Database" model, your app backend and auth logic were the same thing. Now, they are separate, and the cookies act as the bridge:

- First-Party Trust: Your bakery app backend (bakery.com) now issues its own cookies to your frontend. These are "First-Party" cookies, which browsers trust more than cross-domain cookies.
- Token Hiding: The actual OIDC tokens (Access and ID tokens) are never exposed to the browser. They are stored securely on your bakery backend.
- The Session Key: The browser only holds a single HttpOnly session cookie. When the browser makes a request, it sends this cookie to your bakery backend, which then "unwraps" the real OIDC token to talk to your central AuthHub. [3, 4, 5, 6, 7, 8, 9]

## The New Workflow with Cookies + OIDC [10]

1.  Login Redirect: The user is redirected to ://youragency.com to log in.
2.  Callback: The user returns to ://bakery.com with a code.
3.  The Swap: The bakery server swaps that code for OIDC tokens from the AuthHub.
4.  The Cookie Drop: The bakery server saves those tokens in its own session store (or an encrypted cookie) and sends an HttpOnly cookie back to the user.
5.  Data Request: When the user clicks "View Orders," the browser sends the bakery.com cookie. The bakery backend sees it, grabs the "hidden" token, and authorizes the request. [1, 2, 11, 12, 13]

## Why this is a "Security Upgrade"

- Protection against XSS: Even if a malicious script runs on your site, it cannot "see" the OIDC tokens because they are locked behind HttpOnly flags or kept entirely on the server.
- No Third-Party Cookie Issues: Because bakery.com is setting cookies for bakery.com, you don't have to worry about Chrome or Safari blocking "Third-Party" cookies.
- Zero-Config for Frontend Devs: Your frontend developers don't have to write any code to attach "Authorization: Bearer" headers to every request; the browser handles the cookies automatically. [1, 3, 13, 14, 15, 16]

Basically, you keep the exact same "stay logged in" experience, but the technical "handshake" behind the scenes is now enterprise-grade.
Would you like to see the updated "Proxy" code that handles this OIDC-to-Cookie conversion on your bakery backend?

[1] [https://curity.io](https://curity.io/resources/learn/spa-best-practices/)
[2] [https://auth0.com](https://auth0.com/blog/the-backend-for-frontend-pattern-bff/)
[3] [https://curity.io](https://curity.io/resources/learn/oauth-cookie-best-practices/)
[4] [https://stackoverflow.com](https://stackoverflow.com/questions/78486610/oidc-provider-and-oidc-client-ts-how-to-create-sso-between-multiple-app-when-ht)
[5] [https://curity.io](https://curity.io/resources/learn/oauth-cookie-best-practices/)
[6] [https://mojoauth.com](https://mojoauth.com/ciam-qna/why-use-oidc-instead-of-plain-oauth2-for-authentication)
[7] [https://aws.amazon.com](https://aws.amazon.com/blogs/security/reduce-risk-by-implementing-httponly-cookie-authentication-in-amazon-api-gateway/)
[8] [https://developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
[9] [https://stackoverflow.com](https://stackoverflow.com/questions/77396527/spring-boot-backend-as-oauth2-client-and-resource-server-with-session-cookies-re)
[10] [https://github.com](https://github.com/privacycg/CHIPS/issues/80)
[11] [https://medium.com](https://medium.com/singapore-gds/third-party-authentication-part-ii-how-tokens-cookies-and-redirects-a995e41aa806)
[12] [https://medium.com](https://medium.com/@bhubany/setting-up-cookie-based-jwt-authentication-in-spring-boot-dd888eb28e20)
[13] [https://www.reddit.com](https://www.reddit.com/r/node/comments/17conpk/ive_generated_jwt_and_placed_it_in_a_cookie_to/)
[14] [https://security.stackexchange.com](https://security.stackexchange.com/questions/273610/oidc-with-jwt-in-http-only-cookie-instead-of-http-authorization-bearer-header)
[15] [https://curity.io](https://curity.io/resources/learn/token-handler-overview/#:~:text=Browser%20Security%20In%20recent%20years%20it%20has,iframe%2Dbased%20flows%2C%20leading%20to%20blocking%20usability%20issues.)
[16] [https://www.linkedin.com](https://www.linkedin.com/posts/alexxubyte_systemdesign-coding-interviewtips-activity-7352008220317519874-Hunt)

In an OIDC + Separate Backend setup, the refresh token becomes the "secret battery" that keeps the session alive without making the user re-authenticate at the AuthHub.
Here is exactly how the refresh token is handled to maintain that HttpOnly security:

## 1. Storage: The "Server-Side Vault"

When the bakery.com backend completes the handshake with your AuthHub, it receives two tokens:

- Access Token: Short-lived (15 min), used to authorize data requests.
- Refresh Token: Long-lived (30 days), used to get a new Access Token.

The critical change: These tokens are never sent to the browser. Instead, they are stored in a secure session store (like a server-side cache) or inside a highly encrypted, chunked HttpOnly cookie that only the bakery.com backend can decrypt.

## 2. The "Silent Refresh" Logic

Since the browser only has a session cookie, it doesn't know when the Access Token is about to expire. The bakery.com backend handles the "Silent Refresh" internally:

1.  Request hits Backend: Browser sends its session cookie to ://bakery.com.
2.  Expiry Check: The Bakery backend looks at the stored Access Token and sees it expired 2 minutes ago.
3.  Background Swap: Before processing the order, the Bakery backend makes a hidden server-to-server call to ://youragency.com using the Refresh Token.
4.  New Token: The AuthHub sends back a fresh Access Token.
5.  Success: The Bakery backend updates its internal store and finishes the user's original request.

The user sees zero flicker and zero redirects.

## 3. Why this is better for Multi-Tenancy

- Centralized Revocation: If you ban a user in your AuthHub, the very next time the Bakery backend tries to perform a "Silent Refresh," your Hub will reject the Refresh Token. The user is instantly kicked out of the Bakery app.
- No "Token Bloat": Standard JWTs can get very large if you have many roles/permissions. By keeping the Refresh Token and JWT on the backend, you avoid hitting the 4KB limit for browser cookies.
- One Session to Rule Them All: If you eventually build a "Bakery Mobile App," it can use the exact same Refresh Token logic via a standard OIDC flow.

## The "Consultant" Takeaway

By keeping the Refresh Token on the Bakery Backend, you ensure that even if a user's browser is compromised, the attacker cannot steal the "master key" (the Refresh Token) because it simply doesn't exist in the browser's memory.
Would you like the code for the "Internal Refresh" function that manages this swap on the bakery's backend?
