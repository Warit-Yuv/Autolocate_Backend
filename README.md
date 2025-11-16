# AutoLocate Backend — API Reference

This README documents the backend API endpoints, middleware behavior, environment variables required, and notes about JWT blacklisting.

## Overview

- Server: Express (ES modules)
- DB: MySQL (via `mysql2/promise`)
- Auth: JWT stored in an HttpOnly cookie (middleware in `middleware/auth.js`)
- Three DB connection pools (in `db.js`): `adminPool`, `staffPool`, `tenantPool` — each should use a DB user with appropriate privileges.

## Key files

- `server.js` — app bootstrap and router mounts
- `db.js` — database connection pools
- `middleware/auth.js` — JWT issuing/verifying and role middleware
- `routes/tenant.js` — tenant-related endpoints (login, list/test-db)
- `routes/staff.js` — staff auth (login)
- `routes/admin.js` — admin auth (login) and admin-only management endpoints (`/tenants`, `/staff`)
- `routes/auth.js` — `/api/auth/me` and `/api/auth/logout`
- `scripts/seed_test_tenant.js` — demo/seed helper

## Environment variables

Create a `.env` in the backend root. Minimal recommended variables with example values:

```
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=CondoParkingDB

ADMIN_DB_USER=admin_user
ADMIN_DB_PASS=admin_pass
STAFF_DB_USER=staff_user
STAFF_DB_PASS=staff_pass
TENANT_DB_USER=tenant_user
TENANT_DB_PASS=tenant_pass

# JWT / Cookie configuration
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=15m
JWT_COOKIE_NAME=auth_token
JWT_COOKIE_MAX_AGE_MS=900000

# Cookie/CORS behavior (production)
# FRONTEND_ORIGIN must match the actual frontend origin (protocol + host + port)
FRONTEND_ORIGIN=https://app.yourdomain.com
JWT_SAMESITE=none       # use 'none' for cross-site cookies
COOKIE_SECURE=true      # must be true when JWT_SAMESITE=none (browsers require Secure)
COOKIE_DOMAIN=.yourdomain.com  # optional: share cookie across subdomains

# Optional development flag (do NOT enable in production)
# JWT_SEND_IN_BODY=true
```

Notes:
- `JWT_SAMESITE=none` + `COOKIE_SECURE=true` required for cross-origin cookie flows (frontend and API on different origins).
- If API is `https://testapi.notonoty.me` and frontend is `http://localhost:3000`, keep `FRONTEND_ORIGIN=http://localhost:3000`.
- `COOKIE_DOMAIN` is optional. If omitted, the cookie is scoped to the API host (e.g. `testapi.notonoty.me`).

## Production / Cross-origin setup (frontend on other host)

If your frontend runs on another machine at `http://localhost:3000` and your backend is `https://testapi.notonoty.me`, then to allow the browser to receive and send the auth cookie you must:

1. Serve the backend over HTTPS (your backend already uses `https://testapi.notonoty.me`).
2. Configure env vars:
  - `FRONTEND_ORIGIN=http://localhost:3000` (so the server responds with that exact origin in `Access-Control-Allow-Origin`).
  - `JWT_SAMESITE=none`
  - `COOKIE_SECURE=true`
  - (optional) `COOKIE_DOMAIN=.notonoty.me` if you want the cookie available across subdomains.
3. Ensure server sets CORS with `credentials: true` (the app already does this in `server.js`).
4. On the frontend, include credentials on requests:
  - `fetch(url, { credentials: 'include', ... })` or `axios(..., { withCredentials: true })`.

Important browser behavior:
- When `SameSite=None` and `Secure=true`, the cookie will be accepted by the browser and sent with cross-site requests to `https://testapi.notonoty.me` even if the page origin is `http://localhost:3000` — but only when the request is made to the cookie's domain (the API host).
- The cookie is tied to the API domain. For typical setups you do NOT set cookies for `localhost` when the API is on a different domain.
- If you need the cookie shared across subdomains (e.g., `app.notonoty.me` and `api.notonoty.me`), set `COOKIE_DOMAIN=.notonoty.me`.

If you prefer not to deal with cross-site cookies, alternatives:
- Host frontend under the same origin as API (e.g. `app.notonoty.me` and `api.notonoty.me` proxied so origin matches), or
- Use access tokens sent in `Authorization: Bearer <token>` (requires storing tokens in memory or localStorage — less secure than HttpOnly cookies).

## API endpoints

All endpoints are mounted under `/api`.

- Auth endpoints
  - POST `/api/tenant/auth` — tenant login. Body: `{ username, password }`. On success sets an HttpOnly JWT cookie and returns user info.
  - POST `/api/staff/auth` — staff login. Body: `{ username, password }`. Sets JWT cookie with role `staff`.
  - POST `/api/admin/auth` — admin login. Body: `{ username, password }`. Sets JWT cookie with role `admin` or `super-admin` depending on the DB `access_level`.
  - GET `/api/auth/me` — returns `{ user: { id, role } }` from verified token. Requires cookie; returns 401 if missing/invalid.
  - POST `/api/auth/logout` — clears JWT cookie.

- Tenant endpoints
  - GET `/api/tenant/test-db-connection` — quick DB connectivity test.
  - GET `/api/tenant/tenants` — lists tenants (uses tenant DB pool).
  - POST `/api/tenant/auth` — tenant login (see above).

- Admin endpoints (admin-only — require valid JWT and `role === 'admin'`)
  - POST `/api/admin/tenants` — create a new tenant. Body: `{ username, password, first_name?, last_name?, email? }`. This endpoint accepts both `admin` and `super-admin` roles.
  - POST `/api/admin/staff` — create a new staff. Body: `{ username, password, first_name?, last_name?, position?, access_level?, is_Active? }`.
    - Creating/promoting to `Admin` or `Super-Admin` requires the caller to be `super-admin`.
  - PATCH `/api/admin/staff/:id` — modify a staff user's `access_level`. Promoting to or modifying admin-level users requires `super-admin`.

- Staff endpoints
  - POST `/api/staff/auth` — staff login (see above).

## How auth works (JWT cookie)

- On successful login the server signs a JWT with `{ sub: <userId>, role: 'tenant'|'staff'|'admin'|'super-admin' }` and sets it in an HttpOnly cookie (name `token` by default).
- On protected routes the server reads the cookie, verifies the token, and sets `req.user = { id, role }`.
- For admin-only actions, `requireRole('admin','super-admin')` is used where appropriate; actions that create or promote admin-level accounts require `super-admin`.
- Frontend requests must include credentials to receive/send the cookie: `fetch(url, { credentials: 'include' })`.

## Testing

- Start server: `npm run dev` or `npm start`.
- Login from the frontend or use `curl`/Postman with cookies enabled. Example using `fetch` from browser console:

```js
fetch('http://localhost:3001/api/tenant/auth', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', password: 'test' })
})
```

## Notes

- Admin endpoints require the JWT with role `admin`. Use the admin login to obtain the cookie before calling `/api/admin/tenants` or `/api/admin/staff`.
- The admin creation endpoints hash passwords using bcrypt before inserting into the DB.

If you want, I can add token revocation (Redis blacklist) or an admin-only `/api/admin/create-tenant` page and example frontend calls. Let me know which next.
