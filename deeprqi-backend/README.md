# DeepRQI — Backend (Milestone 4)

Node 22 + Express + Prisma. Auth (JWT + bcrypt) and an upload endpoint that
proxies to the FastAPI AI service and persists everything to Postgres.
No Docker.

## 1. Hosted Postgres — Supabase or Neon

Pick one, both have a free tier:

**Supabase**
1. Create a project at supabase.com
2. Go to Project Settings → Database → Connection string → copy the URI
   (use "Session" mode pooler for local dev — simpler than dealing with
   PgBouncer transaction-mode quirks)
3. In the SQL editor, run: `create extension if not exists postgis;`
   (not used until Phase 2, but free to enable now)

**Neon**
1. Create a project at neon.tech
2. The connection string is right on the dashboard
3. Same SQL: `create extension if not exists postgis;`

Either way, you end up with a `DATABASE_URL` like:
```
postgresql://user:password@host:5432/postgres?sslmode=require
```

## 2. Setup

```bash
cd deeprqi-backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — paste your Supabase/Neon connection string
- `JWT_SECRET` — generate one: `openssl rand -hex 32`
- `FASTAPI_URL` — leave as `http://localhost:8000` if the AI service
  (Milestone 3) is running locally on its default port

## 3. Create the schema

```bash
npm run prisma:migrate
```

This creates the 5 Phase 1 tables (`users`, `roads`, `road_images`,
`detections`, `rqi_scores`) directly on your hosted Postgres — no local
Postgres install needed. You'll see the tables appear in Supabase's Table
Editor (or Neon's SQL console) immediately.

## 4. Run

Make sure the FastAPI service from Milestone 3 is running on port 8000
first, then:

```bash
npm run dev
```

## 5. Test it

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Rounak","email":"you@example.com","password":"testpass123"}'
```
Copy the `token` from the response.

**Upload an image** (replace `<TOKEN>` and the file path):
```bash
curl -X POST http://localhost:5000/api/images/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/road_photo.jpg" \
  -F "roadName=MG Road" \
  -F "city=Vellore" \
  -F "lat=12.9165" \
  -F "lng=79.1325"
```

You should get back the created road, the image record with its
detections, the RQI score, and the heatmap — the full Phase 1 loop, now
persisted.

## Milestone 6 additions — spatial queries + dashboard stats

New endpoints, all under `/api` and all `requireAuth`:

- **`GET /api/roads`** — every road plus its most recent RQI score. What
  the map dashboard (Milestone 7) will plot.
- **`GET /api/roads/near?lat=..&lng=..&radiusKm=5`** — PostGIS `ST_DWithin`
  search, nearest-first. `radiusKm` defaults to 5 if omitted.
- **`GET /api/roads/:id`** — full inspection history for one road (every
  image, its detections, and its RQI score), for the road detail page.
- **`GET /api/dashboard/stats`** — total roads, average RQI, and critical
  road count, computed off each road's *latest* score only.

### One more migration step

Since `location` is a PostGIS `geography` column, Prisma can generate the
`ALTER TABLE` for it (it's declared `Unsupported(...)` in the schema) but
can't query it through the normal Prisma Client API — that's what
`src/lib/geo.js` and its `$queryRaw`/`$executeRaw` calls are for.

Run the migration same as before:
```bash
npm run prisma:migrate
```
If you already ran `create extension if not exists postgis;` back in
Milestone 4, no further SQL setup is needed — the column creation and
index just work.

A road's `location` gets set automatically the first time an image is
uploaded for it with `lat`/`lng` in the form data (already the case in
your `curl` tests) — no separate step required.

## What happens if the AI service is down

Per the spec, the upload isn't silently lost: the image record is still
saved (marked with no detections yet) and the response comes back as a
`502` telling you to retry, with the `imageId` so you can find it later.
A proper retry queue is explicitly a Phase 2 upgrade, not needed yet.
