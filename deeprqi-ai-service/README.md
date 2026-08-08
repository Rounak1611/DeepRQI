# DeepRQI — AI Service (Milestone 3)

FastAPI service: image in -> YOLO detections + severity + RQI score + EigenCAM
heatmap out. Runs natively, no Docker.

## What's here

```
deeprqi-ai-service/
  app/
    config.py          damage weights, severity thresholds, class names, MODEL_PATH
    schemas.py          request/response shapes
    severity.py          bbox-area -> severity label
    rqi_engine.py         pure scoring function (unit-testable, no model needed)
    explainability.py     EigenCAM (gradient-free, works on YOLO26's head)
    main.py               FastAPI app, ties everything together
  requirements.txt
  .env.example
  test_rqi_engine.py     standalone RQI math check, no server needed
```

## Setup (run once)

```bash
cd deeprqi-ai-service
python -m venv .venv

# activate it:
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

pip install -r requirements.txt
cp .env.example .env
```

Leave `.env` as-is for now (`MODEL_PATH=yolo26s.pt`) — Ultralytics will
auto-download the stock COCO checkpoint on first run. That's enough to prove
every piece of this service works end-to-end. Once your GPU training finishes,
edit `.env` to point `MODEL_PATH` at your real `best.pt` and restart the
server — nothing else changes.

## Step 1 — check the RQI math on its own, no model/server needed

```bash
python test_rqi_engine.py
```

You should see four `PASS` lines. This is the fastest way to catch a scoring
bug before it's tangled up with image/model complexity.

## Step 2 — run the server

```bash
uvicorn app.main:app --reload --port 8000
```

First run will download the COCO checkpoint (a few seconds to a couple
minutes depending on your connection) and print a warning that the loaded
model's class count doesn't match DeepRQI's 4 trained classes — expected and
fine until you swap in your real weights.

## Step 3 — test it

Check the service is up:
```bash
curl http://localhost:8000/health
```

Send a real image (any road photo, or literally any .jpg for now while it's
still the placeholder model):
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/some_road_photo.jpg" \
  -o response.json

cat response.json
```

Or open **http://localhost:8000/docs** in a browser — FastAPI's auto-generated
Swagger UI, where you can upload an image through a form and see the full
JSON response directly, no curl needed.

You should get back JSON with:
- `detections`: list of damage type / confidence / bbox / severity
- `rqi`: score, category, and a full per-detection penalty breakdown
- `heatmap_base64`: a PNG heatmap, base64-encoded (paste it into an
  [online base64-to-image tool](https://base64.guru/converter/decode/image)
  to preview it quickly, or we'll wire it directly into the React frontend
  in a later milestone)

## Swapping in your real trained model later

1. Finish GPU training in Colab, confirm `best.pt` exists.
2. Copy it locally (Google Drive desktop sync, or just download it).
3. Edit `.env`:
   ```
   MODEL_PATH=/absolute/path/to/best.pt
   ```
4. Restart the server (`Ctrl+C`, then `uvicorn app.main:app --reload --port 8000` again).
5. Check `/health` — `is_placeholder_model` should now read `false`.

No other code changes needed anywhere in this service.
