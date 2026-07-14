# school-admin

Version **1.1.0**

Web admin panel for the AVAASchool pre-school management system (Admin & Super Admin).

## Stack
React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · React Router · TanStack Query · Axios

## Connected modules (live backend API)
Dashboard · Admissions · Students · Classes · Fees · Attendance · Daycare · Academic · Communication · Users

> Staff is a placeholder pending its backend module.

## Getting started
```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL defaults to /api (proxied to the backend)
npm run dev            # http://localhost:5173
```
The dev server proxies `/api` to the NestJS backend on `http://localhost:3000`
(see `vite.config.ts`). Sign in with the seeded super-admin account.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — type-check + production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

## Changelog


### v1.0.0 — Super Admin console (2026-07-02)
The web app is now the Super Admin's SaaS control panel (schools run their day-to-day work through the mobile app).

- [x] **Role-gated access** — non-super-admins are locked out of the console; nav trimmed to Dashboard / Schools / Users.
- [x] **Schools page** — list with search + status filter, stats row, paginated table.
- [x] **School creation** — "+ Add school" drawer that also creates the school's admin login in one step.
- [x] **School detail (drill-in)** — clicking a school opens its full page: student/teacher/parent/account counts, school info, and every account under it.
- [x] **Users page** — list + "+ Add user" form (with school selector) + a School column showing which school each account belongs to.
- [x] **Dashboard** — retained from the existing build.

### v1.0.1 — Invite-based admin onboarding (2026-07-02)
- [x] **Forms collect name + email only** — the School and User forms no longer ask for a password; the new account is emailed a set-password link.
- [x] **Invite link surfaced** — after creating a school/user, the drawer shows the set-password link (copyable) until email delivery is wired.
- [x] **Public `/set-password` page** — the invited admin lands here from the link, sees their email, sets a password, and is sent to sign in.

### v1.0.2 — Parent OTP login + Admin wired to real backend (2026-07-02)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.0.3 — Teacher and Parent roles wired to real backend (2026-07-02)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.0.4 — All portals completed per workflow diagrams (2026-07-03)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.0.5 — Indian phone format, SMTP email, workflow fixes (2026-07-03)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.0.6 — Super admin console redesign + mobile motion pass (2026-07-03)
Console restyled as a multi-school SaaS: dark sidebar with brand mark and signed-in user card, platform-overview dashboard (KPI tiles, schools-by-status strip, recent schools, quick actions), split-screen branded login, avatar+pill table styling, and animated slide-in drawers (shared `Drawer` component; backdrop fade, Esc/backdrop-click to close).

### v1.0.7 - No changes made in the web view.


### v1.0.8 - No changes made in the web view.

### v1.0.9 — Teacher neumorphic redesign, per-student diary, account-switch fix (2026-07-04)
No changes made in the web view — mobile-only patch described in the Flutter README.

### v1.1.0 — Notification fixes, clear-read, parent profile-update alert (2026-07-05)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.1.3 — NO Changes on this 
No web changes in this patch 

### v1.1.4 — Socket.IO real-time chat (backend) + OTP test email (2026-07-11)
No web changes in this patch — backend and mobile-only changes described in the backend and Flutter READMEs.

### v1.1.5 — Token refresh fixed (2026-07-13)
The console was affected by the same session-expiry bug as the mobile app: `POST /auth/refresh` was guarded by the access-token guard, so once the 15-minute access token expired the refresh call returned 401, `tokenStore.clear()` ran, and the admin was bounced to the login screen mid-session. The fix is server-side (see the backend README) — the console needed only one change.

- [x] **`src/lib/api.ts`** — `refreshTokens()` no longer sends `Authorization: Bearer <expired access token>` with the refresh request. The refresh token in the body is now the only credential the endpoint uses. The comment claiming "backend guards /auth/refresh with JWT" is gone, because it no longer does.

### v1.1.6 — The session survives a page reload (2026-07-13)
v1.1.5 fixed refresh *during* a session; reloading the page still logged you out. `AuthProvider` treated an expired access token as "signed out" on first paint, so any reload more than 15 minutes after login bounced to `/login` — even though a perfectly good refresh token was sitting in `localStorage`. A session now lasts until the admin signs out (see backend v1.1.6 for the server side).

- [x] **`src/auth/AuthProvider.tsx`** — restores the session on load: an expired access token is no longer a logout, it's a cue to trade the refresh token in first. New `isRestoring` flag while that call is in flight.
- [x] **`src/components/ProtectedRoute.tsx`** — shows a spinner while `isRestoring` instead of redirecting, so the restore isn't raced to `/login`.
- [x] **`src/pages/LoginPage.tsx`** — an already-signed-in admin landing here (bookmark, back button) is sent home rather than asked to sign in again.
- [x] **`src/lib/api.ts`** — the 401-retry path's refresh is now the exported, de-duplicated `refreshSession()`, shared with the boot-time restore so a burst of 401s can't rotate the token twice.
- [x] **Logout ends only this browser** — `POST /auth/logout` now carries the refresh token, so the admin's phone stays signed in.
- [x] **Note:** everyone is signed out **once** on deploy — pre-v1.1.6 refresh tokens have no device `sid` and are rejected. Normal behaviour resumes after that login.


### v1.1.7 — NO Changes on this 
No web changes in this patch 