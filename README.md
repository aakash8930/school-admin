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
