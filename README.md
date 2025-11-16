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

Create a `.env` in the backend root with at least:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=CondoParkingDB

ADMIN_DB_USER=admin_user
ADMIN_DB_PASS=admin_pass
STAFF_DB_USER=staff_user
STAFF_DB_PASS=staff_pass
TENANT_DB_USER=tenant_user
TENANT_DB_PASS=tenant_pass

JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=1h
JWT_COOKIE_NAME=token

PORT=3001
```

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
