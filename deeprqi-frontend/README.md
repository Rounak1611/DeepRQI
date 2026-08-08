# DeepRQI — Frontend (Milestone 5)

React + Vite. Login, upload, and results pages — the last piece of the
Phase 1 loop. No Docker.

## Design notes

The theme is deliberately grounded in the subject matter rather than a
generic dashboard template: dark asphalt background, road-line yellow
accent, and an actual instrument-cluster **speedometer gauge** for the RQI
score (0 = critical/red on the left, 100 = good/green on the right) instead
of a plain progress bar. Headings use a condensed signage-style face
(Oswald); data values use a monospace face (JetBrains Mono) so numbers
read cleanly at a glance, the way they would on a dashboard.

## Setup

```bash
cd deeprqi-frontend
npm install
cp .env.example .env
```

`.env` just needs `VITE_API_URL` pointing at your backend (default
`http://localhost:5000` — leave as-is if running locally).

## Run

Make sure both Milestone 3 (FastAPI, port 8000) and Milestone 4
(Node/Express, port 5000) are running first, then:

```bash
npm run dev
```

Open **http://localhost:5173**.

## What it does

1. **Login page** — register or log in. JWT is stored in `localStorage`
   and attached to every API call automatically.
2. **Upload page** — drag-and-drop a road photo, fill in road name/city and
   optionally lat/lng (or use "Use my current location"), submit. This
   calls `POST /api/images/upload` on the backend, which itself forwards
   the image to the FastAPI service, persists everything, and returns the
   full result.
3. **Results page** —
   - The uploaded photo with detection bounding boxes drawn over it,
     color-coded by severity, labeled with damage type + confidence
   - The RQI gauge with the numeric score and category
   - A penalty breakdown table (damage type, severity, points deducted) —
     the same audit trail the backend computed, so the score is never a
     black box
   - The EigenCAM heatmap below, with a one-line note on what it does and
     doesn't prove (per the explainability limitations already documented
     in the project's QA doc)

## Current state vs. the placeholder model

Until your GPU training finishes and `MODEL_PATH` in the AI service points
at the real `best.pt`, uploads will come back with an empty detection list
and RQI 100 — that's the AI service correctly reporting "no damage" against
a model that doesn't know road damage yet, not a frontend bug. Nothing
here changes once the real model is swapped in.
