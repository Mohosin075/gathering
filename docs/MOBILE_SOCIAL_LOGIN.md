# Mobile Social Login (Google + Apple)

Backend API guide for the Gathering mobile app.

Base URL: `{API_BASE}/api/v1`  
Auth prefix: `/auth`

---

## Overview

| Provider | Endpoint | What app sends |
|----------|----------|----------------|
| Google | `POST /auth/google-login-token` | Google `idToken` + FCM/APNs `deviceToken` |
| Apple | `POST /auth/apple-login-token` | Apple `identityToken` + `deviceToken` (+ email/name on first login) |

Flow (both):

1. User taps Google / Apple Sign In in the app
2. SDK returns a provider token
3. App calls Gathering API with that token
4. API verifies token with Google/Apple, creates or finds user, returns JWT

```text
App SDK → idToken / identityToken → Gathering API → accessToken + refreshToken
```

Do **not** use `/auth/social-login` for Google/Apple. That endpoint does not verify provider tokens.

---

## Common response

### Success `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Welcome back John",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "role": "user"
  }
}
```

Axios example path: `response.data.data.accessToken`  
(Fetch: `json.data.accessToken`)

### App should

1. Save `accessToken` and `refreshToken` from **response body** (Keychain / Keystore). Do not rely only on cookies — native apps often cannot use the server `httpOnly` cookie.
2. Send protected requests with:
   ```http
   Authorization: Bearer <accessToken>
   ```
   (`Bearer` + space + token — required by API)
3. When access token expires (`401` / `Access Token has expired`), call refresh (below)

### Refresh token (mobile)

`POST /api/v1/auth/refresh-token`  
`Content-Type: application/json`

```json
{
  "refreshToken": "<saved refresh token>"
}
```

Success `data`:

```json
{
  "accessToken": "<new jwt>",
  "refreshToken": "<new jwt>"
}
```

Save both again. (Cookie is also set for web; mobile should use the JSON body.)

---

## 1. Google Sign In

### Endpoint

`POST /api/v1/auth/google-login-token`  
`Content-Type: application/json`

### Body

```json
{
  "idToken": "<Google ID token JWT>",
  "deviceToken": "<FCM or APNs device token>"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `idToken` | Yes | From Google Sign-In SDK (**ID token**, not access token / server auth code) |
| `deviceToken` | Yes | Push token; non-empty string (`min 1`). Login fails if missing/empty. |

### iOS

1. Configure Google Sign-In with your iOS OAuth client ID
2. Backend must accept your token audience:
   - Set server `GOOGLE_IOS_CLIENT_ID` = iOS client ID, **or**
   - Request ID token with Web client as `serverClientId` so `aud` matches `GOOGLE_CLIENT_ID`
3. After sign-in, read the **idToken** string
4. Get FCM/APNs token (non-empty)
5. `POST /auth/google-login-token`

### Android

1. Configure Google Sign-In
2. Use Web client ID as `serverClientId` so `aud` = `GOOGLE_CLIENT_ID`, **or** set server `GOOGLE_ANDROID_CLIENT_ID`
3. Take **ID token** from the account result
4. `POST /auth/google-login-token` with `deviceToken`

### Backend env (server team)

```env
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=....apps.googleusercontent.com      # if iOS aud/azp differs
GOOGLE_ANDROID_CLIENT_ID=....apps.googleusercontent.com  # if Android aud/azp differs
```

Server accepts token if `aud` **or** `azp` matches one of those IDs.

If not matched, API message:

`Invalid Google ID Token audience`

### Pseudocode

```ts
const googleUser = await GoogleSignIn.signIn()
const idToken = googleUser.idToken // must exist
if (!idToken) throw new Error('Missing Google idToken')

const deviceToken = await getPushToken()
if (!deviceToken) throw new Error('Missing deviceToken')

const res = await api.post('/auth/google-login-token', {
  idToken,
  deviceToken,
})

const { accessToken, refreshToken, role } = res.data.data
await saveTokens(accessToken, refreshToken)
```

---

## 2. Apple Sign In

### Endpoint

`POST /api/v1/auth/apple-login-token`  
`Content-Type: application/json`

### Body

```json
{
  "identityToken": "<Apple identityToken JWT>",
  "deviceToken": "<FCM or APNs device token>",
  "fullName": "Optional — first sign-in only",
  "email": "Optional — first sign-in only"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `identityToken` | Yes | Apple **identity token** JWT string (not authorization `code`) |
| `deviceToken` | Yes | Push token; non-empty |
| `fullName` | No | Apple sends name **only on first authorization**. Persist and resend. |
| `email` | No | Apple may send email **only once** (real or `privaterelay.appleid.com`). Returning users work via Apple `sub` even without email in the token. **First-time** account create needs email from token **or** this field. |

Empty string / `null` for `email` / `fullName` is OK — backend ignores them.

### Critical Apple rules for the app

1. On **first** successful Apple credential, persist locally:
   - `email` (if provided)
   - `fullName` (givenName + familyName joined)
2. On every login, send:
   - fresh `identityToken`
   - `deviceToken`
   - stored `fullName` / `email` when available (required for first create if token has no email)
3. Never invent emails
4. Server `APPLE_CLIENT_ID` must equal the iOS **Bundle ID** (JWT `aud`), e.g. `com.gathering.app`

### iOS setup checklist

1. Xcode → Signing & Capabilities → **Sign in with Apple**
2. Apple Developer → App ID → enable Sign in with Apple
3. Use `ASAuthorizationAppleIDProvider` / React Native Apple Auth / Expo Apple
4. Read `credential.identityToken` as a **string** (JWT)
5. On first auth, also read `credential.email` and full name

### Pseudocode

```ts
const apple = await AppleSignIn.signIn()
const identityToken = apple.identityToken
if (!identityToken) throw new Error('Missing Apple identityToken')

// First login only — Apple may omit these later
if (apple.email) await storage.set('appleEmail', apple.email)
if (apple.fullName) await storage.set('appleFullName', apple.fullName)

const deviceToken = await getPushToken()
if (!deviceToken) throw new Error('Missing deviceToken')

const res = await api.post('/auth/apple-login-token', {
  identityToken,
  deviceToken,
  email: (await storage.get('appleEmail')) || undefined,
  fullName: (await storage.get('appleFullName')) || undefined,
})

const { accessToken, refreshToken, role } = res.data.data
await saveTokens(accessToken, refreshToken)
```

---

## Error reference (app handling)

| HTTP | Typical message | What app should do |
|------|-----------------|--------------------|
| `400` | `Invalid Google ID Token` / `Invalid Apple identity token` | Re-run native sign-in; send a **fresh** token |
| `400` | `Invalid Google ID Token audience` | OAuth client ID mismatch vs server env |
| `400` | `Email is required for first-time Apple Sign In...` | First Apple login must include email from Apple credential / storage |
| `409` | `...already exists with another sign-in method.` | Account already linked to a **different social provider** (Google ↔ Apple). Tell user to use the original method. |
| `409` | `An account with this email already exists...` | Email already registered (e.g. conflict on create) |
| `429` | `You are restricted to login for N minutes` | Temporary lockout — show wait message |
| `500` | `Google Sign In is not configured` / `Apple Sign In is not configured` | Server env missing |
| `401` | `Access Token has expired` | Call `/auth/refresh-token` with saved refresh token |

Note: Email/password users **without** a social `provider` can still be linked on first Google/Apple login with the same email. `409` applies when `provider` is already set to the **other** social network (or a different `appId` is already bound).

---

## Account linking rules (QA)

- One social provider binding per account in the current model (`provider` + `appId`)
- Google email already used with Apple → `409` (and reverse)
- Soft-deleted users signing in again with same Google/Apple identity are restored to `active`
- Returning Apple users often have **no email in the token** — normal if user already exists by Apple `sub` (`appId`)

---

## Checklist before release

### App

- [ ] Google returns **idToken** (not accessToken only)
- [ ] Apple returns **identityToken** string
- [ ] `deviceToken` never empty before calling API
- [ ] Apple first login stores and resends email + fullName
- [ ] Tokens saved from **JSON body**; `Authorization: Bearer ...` used after login
- [ ] Refresh uses `POST /auth/refresh-token` with `{ "refreshToken": "..." }`
- [ ] Handle `409` with clear UI copy

### Server (each environment)

- [ ] `GOOGLE_CLIENT_ID` (+ `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` if needed)
- [ ] `APPLE_CLIENT_ID` = exact iOS Bundle ID
- [ ] `clientUrl` (web Google OAuth callback redirect only — not required for mobile token APIs)

---

## Quick test (Postman / curl)

Use tokens from a real simulator/device. Fake JWTs will fail verification.

```bash
# Google
curl -X POST "$API/api/v1/auth/google-login-token" \
  -H "Content-Type: application/json" \
  -d '{"idToken":"REAL_GOOGLE_ID_TOKEN","deviceToken":"test-device"}'

# Apple
curl -X POST "$API/api/v1/auth/apple-login-token" \
  -H "Content-Type: application/json" \
  -d '{"identityToken":"REAL_APPLE_IDENTITY_TOKEN","deviceToken":"test-device","email":"user@privaterelay.appleid.com","fullName":"Jane Doe"}'

# Refresh (mobile)
curl -X POST "$API/api/v1/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REAL_REFRESH_TOKEN"}'
```
